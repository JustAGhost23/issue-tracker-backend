import { User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const createCommentSchema = z.object({
  body: z.object({
    ticketId: z.coerce
      .number({
        invalid_type_error: "ticketId not a number",
        required_error: "ticketId is a required path parameter",
      })
      .positive({
        message: "invalid ticketId",
      })
      .int({
        message: "invalid ticketId",
      }),
    text: z
      .string({
        invalid_type_error: "Name is not a string",
        required_error: "Name is required",
      })
      .min(1, { message: "Must be atleast 1 character long" })
      .max(500, { message: "Must be atmost 500 characters long" }),
  }),
});

/**
 @route /api/comment/
 @type RequestHandler
 */

export const createCommentValidator: RequestHandler =
  validate(createCommentSchema);

export const createComment = async (req: Request, res: Response) => {
  try {
    // Check if user is valid
    const reqUser = req.user as User;
    if (!reqUser) {
      return res.status(400).send({ error: "Invalid user sent in request" });
    }
    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: reqUser.id,
      },
    });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: req.body.ticketId,
      },
      select: {
        id: true,
        projectId: true,
      },
    });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
    }

    // Check if project exists
    const project = await prisma.project.findFirst({
      where: {
        id: ticket.projectId,
      },
      select: {
        id: true,
        members: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    // Check if user is a member of the project
    if (
      !project.members.some((element) => {
        if (element.id == user.id) {
          return true;
        }
        return false;
      })
    ) {
      return res
        .status(400)
        .send({ error: "User is not a member of the project" });
    }

    const comment = await prisma.comment.create({
      data: {
        text: req.body.text,
        author: {
          connect: {
            id: user.id,
          },
        },
        ticket: {
          connect: {
            id: ticket.id,
          },
        },
      },
    });
    if (!comment) {
      return res
        .status(500)
        .send({ error: "Something went wrong while creating new comment" });
    }

    const newComment = await prisma.comment.findFirst({
      where: {
        id: comment.id,
      },
      select: {
        id: true,
        text: true,
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            provider: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        ticket: {
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Comment created successfully
    return res.status(200).send({
      data: {
        newComment,
      },
      message: "Comment created successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while creating new comment",
    });
  }
};
