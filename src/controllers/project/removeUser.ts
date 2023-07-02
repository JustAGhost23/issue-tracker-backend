import { User } from "@prisma/client";
import { Request, RequestHandler, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const removeUserSchema = z.object({
  params: z.object({
    username: z
      .string({
        invalid_type_error: "Username is not a string",
        required_error: "Username is required",
      })
      .min(8, { message: "Must be at least 8 characters long" })
      .max(20, { message: "Must be at most 20 characters long" }),
    name: z
      .string({
        invalid_type_error: "Name is not a string",
        required_error: "Name is required",
      })
      .min(4, { message: "Must be atleast 4 characters long" })
      .max(60, { message: "Must be atmost 60 characters long" })
      .refine(
        (s) => {
          return !s.trimStart().trimEnd().includes(" ");
        },
        (s) => ({
          message: `${s} is not a valid project name, please remove the whitespaces`,
        })
      )
      .refine(
        (s) => {
          return !/[A-Z]/.test(s);
        },
        (s) => ({
          message: `${s} is not a valid project name, please remove the capital letters`,
        })
      ),
  }),
  body: z.object({
    username: z
      .string({
        invalid_type_error: "Username is not a string",
        required_error: "Username is required",
      })
      .min(8, { message: "Must be at least 8 characters long" })
      .max(20, { message: "Must be at most 20 characters long" }),
  }),
});

/**
 * @route POST /api/project/:username/:name/remove-user
 * @type RequestHandler
 */

// Function to validate request using zod schema
export const removeUserValidator: RequestHandler = validate(removeUserSchema);

export const removeUser = async (req: Request, res: Response) => {
  try {
    // Check if user is valid
    const reqUser = req.user as User;
    if (!reqUser) {
      return res.status(400).send({ error: "Invalid user sent in request" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        id: reqUser.id,
      },
    });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Check if user to be removed exists
    const removedUser = await prisma.user.findFirst({
      where: {
        username: req.body.username,
      },
    });
    if (!removedUser) {
      return res.status(404).send({ error: "User to be removed not found" });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: {
        projectName: { name: req.params.name, createdById: reqUser.id },
      },
    });
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    // Check if user owns project
    if (reqUser.username != req.params.username) {
      return res.status(403).send({ error: "User does not own this project" });
    }

    // Check if user to be removed is project owner
    if (user.id == removedUser.id) {
      return res.status(400).send({
        error:
          "Cannot remove project owner, please transfer ownership or delete project",
      });
    }

    // Update project
    const newProject = await prisma.project.update({
      where: {
        projectName: { name: req.params.name, createdById: reqUser.id },
      },
      data: {
        members: {
          disconnect: {
            id: removedUser.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdBy: {
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
        members: {
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
        tickets: true,
        createdAt: true,
      },
    });

    // Added user successfully
    res.status(200).send({
      data: {
        newProject,
      },
      message: "Removed user successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while adding user to project",
    });
  }
};
