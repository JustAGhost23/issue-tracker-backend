import { User } from "@prisma/client";
import { Request, RequestHandler, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const transferOwnershipSchema = z.object({
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
 * @route POST /api/project/:username/:name/transfer
 * @type RequestHandler
 */

// Function to validate request using zod schema
export const transferOwnershipValidator: RequestHandler = validate(
  transferOwnershipSchema
);

export const transferOwnership = async (req: Request, res: Response) => {
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

    // Check if project owner exists
    const projectOwner = await prisma.user.findFirst({
      where: {
        username: req.params.username,
      },
    });
    if (!projectOwner) {
      return res.status(404).send({ error: "Project owner not found" });
    }

    // Check if user to be made owner exists
    const newProjectOwner = await prisma.user.findFirst({
      where: {
        username: req.body.username,
      },
    });
    if (!newProjectOwner) {
      return res.status(404).send({ error: "User to be made owner not found" });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: {
        projectName: { name: req.params.name, createdById: projectOwner.id },
      },
    });
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    // Check if user owns project
    if (reqUser.username != req.params.username) {
      return res.status(403).send({ error: "User does not own this project" });
    }

    // Update project
    const newProject = await prisma.project.update({
      where: {
        projectName: { name: req.params.name, createdById: projectOwner.id },
      },
      data: {
        createdBy: {
          connect: {
            id: newProjectOwner.id,
          },
        },
        members: {
          connect: {
            id: newProjectOwner.id,
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
        tickets: {
          select: {
            name: true,
            description: true,
            priority: true,
            status: true,
          },
        },
        createdAt: true,
      },
    });

    // Transferred ownership successfully
    res.status(200).send({
      data: {
        newProject,
      },
      message: "Transferred ownership successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while transferring ownership of project",
    });
  }
};
