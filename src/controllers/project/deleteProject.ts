import { Role, User } from "@prisma/client";
import { Request, RequestHandler, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";
import { sendProjectDeletedMail } from "../../middlewares/emailNotifications.js";

// Zod schema to validate request
const deleteProjectSchema = z.object({
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
});

/**
 @route POST /api/project/:username/:name/delete
 @type RequestHandler
 */

// Function to validate request using zod schema
export const deleteProjectValidator: RequestHandler =
  validate(deleteProjectSchema);

export const deleteProject = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    // Check if project owner exists
    const projectOwner: User | null = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });
    if (!projectOwner) {
      return res.status(404).send({ error: "Project owner not found" });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: {
        projectName: { name: req.params.name, createdById: projectOwner.id },
      },
      include: {
        members: {
          select: {
            email: true,
          },
        },
      },
    });
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    // Get members emailIds
    const emailIds: string[] = project.members.map((user) => user.email);

    // Check if user owns project
    if (user.role !== Role.ADMIN) {
      if (user.username !== projectOwner.username) {
        return res
          .status(403)
          .send({ error: "User does not own this project" });
      }
    }

    const projectName = project.name;

    // Delete project from database
    const deletedProject = await prisma.project.delete({
      where: {
        projectName: { name: project.name, createdById: projectOwner.id },
      },
    });
    if (!deletedProject) {
      res
        .status(500)
        .json({ message: "Something went wrong while deleting project" });
      return;
    }

    try {
      await sendProjectDeletedMail(user, projectName, emailIds);

      // Email sent successfully
      res.status(200).send({ message: "Deleted project successfully" });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while deleting project",
    });
  }
};
