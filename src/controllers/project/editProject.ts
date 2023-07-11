import { Project, Role, User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";

// Zod schema to validate request
const editProjectSchema = z.object({
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
    newProjectName: z
      .string({
        invalid_type_error: "newProjectName is not a string",
        required_error: "newProjectName is required",
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
      )
      .optional(),
    description: z
      .string({
        invalid_type_error: "Description must be of type string",
      })
      .optional(),
  }),
});

/**
 @route POST /api/project/:username/:name/edit
 @type RequestHandler
 */

export const editProjectValidator: RequestHandler = validate(editProjectSchema);

export const editProject = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    // Get projectOwner
    const projectOwner = await prisma.user.findUnique({
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
    });
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    if (req.body.newProjectName) {
      if (project.name !== req.body.newProjectName) {
        // Check if another project with same name and owner exists
        const foundName: Project | null = await prisma.project.findUnique({
          where: {
            projectName: { name: req.body.name, createdById: user.id },
          },
        });
        if (foundName) {
          return res
            .status(409)
            .send({ error: "Another project with this name already exists" });
        }
      }
    }

    if (user.role !== Role.ADMIN) {
      // Check if user owns the project
      if (user.id !== projectOwner.id) {
        return res.status(404).send({
          error:
            "Cannot edit a project owned by someone else without admin role",
        });
      }
    }

    if (req.body.newProjectName) {
      project.name = req.body.newProjectName;
    }
    if (req.body.description) {
      project.description = req.body.description;
    }

    // Update project
    const newProject = await prisma.project.update({
      where: {
        projectName: { name: req.params.name, createdById: projectOwner.id },
      },
      data: project,
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
            role: true,
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
            role: true,
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
        updatedAt: true,
      },
    });
    if (!newProject) {
      return res
        .status(500)
        .send({ error: "Something went wrong while editing project" });
    }

    // Project edited successfully
    return res.status(200).send({
      data: {
        newProject,
      },
      message: "Project edited successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while editing project",
    });
  }
};
