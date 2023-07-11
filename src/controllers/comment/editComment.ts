import { ActivityType, User } from "@prisma/client";
import { RequestHandler, Request, Response, text } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";
import { sendCommentEditedEmail } from "../../middlewares/emailNotifications.js";

// Zod schema to validate request
const editCommentSchema = z.object({
  params: z.object({
    commentId: z.coerce
      .number({
        invalid_type_error: "commentId not a number",
        required_error: "commentId is a required path parameter",
      })
      .positive({
        message: "invalid commentId",
      })
      .int({
        message: "invalid commentId",
      }),
  }),
  body: z.object({
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
 @route POST /api/comment/:commentId/edit
 @type RequestHandler
 */

export const editCommentValidator: RequestHandler = validate(editCommentSchema);

export const editComment = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: {
        id: parseInt(req.params.commentId),
      },
    });
    if (!comment) {
      return res.status(404).send({ error: "Comment not found" });
    }

    // Get ticket from comment
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: comment.ticketId,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        reportedBy: {
          select: {
            email: true,
          },
        },
        assignees: {
          select: {
            email: true,
          },
        },
      },
    });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
    }

    // Check if user made the comment
    if (user.id !== comment.authorId) {
      return res
        .status(403)
        .send({ error: "User cannot edit a comment made by someone else" });
    }

    comment.text = req.body.text;

    // Edit the comment
    const updatedComment = await prisma.comment.update({
      where: {
        id: parseInt(req.params.commentId),
      },
      data: comment,
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
            role: true,
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
    if (!updatedComment) {
      return res
        .status(500)
        .send({ error: "Something went wrong while editing comment" });
    }

    const emailIds = ticket.assignees.map((assignee) => assignee.email);
    emailIds.push(ticket.reportedBy.email);

    const issueActivity = await prisma.issueActivity.create({
      data: {
        type: ActivityType.UPDATED,
        text: `${user.username} edited a comment under the ticket: ${ticket.name} in the project: ${ticket.project.name}.`,
        ticket: {
          connect: {
            id: ticket.id,
          },
        },
        author: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    try {
      await sendCommentEditedEmail(issueActivity, ticket, emailIds);

      // Comment edited successfully
      return res.status(200).send({
        data: {
          updatedComment,
        },
        message: "Edited comment successfully",
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while editing comment",
    });
  }
};
