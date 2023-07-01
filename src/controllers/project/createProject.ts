import { Project, User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db";
import { validate } from "../../utils/zodValidateRequest";
import { z } from "zod";

// Zod schema to validate request
const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string({
        invalid_type_error: "Name is not a string",
        required_error: "Name is required",
      })
      .min(4, { message: "Must be atleast 4 characters long" })
      .max(60, { message: "Must be atmost 60 characters long" }),
    description: z
      .string({
        invalid_type_error: "Description must be of type string",
      })
      .optional(),
  }),
});

/**
 * @route POST /api/projects
 * @desc Create a new project
 */

// Function to validate request using zod schema
export const createProjectValidator: RequestHandler =
  validate(createProjectSchema);

export const createProject = async (req: Request, res: Response) => {
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

    // Check if another project with same name and owner exists
    const foundName: Project | null = await prisma.project.findUnique({
      where: {
        projectName: { name: req.body.name, createdById: reqUser.id },
      },
    });
    if (foundName) {
      return res
        .status(409)
        .send({ error: "Another project with this name already exists" });
    }

    // Create new project
    let project: Project;
    if (!req.body.description) {
      project = await prisma.project.create({
        data: {
          name: req.body.name,
          createdBy: {
            connect: {
              id: reqUser.id,
            },
          },
        },
      });
    } else {
      project = await prisma.project.create({
        data: {
          name: req.body.name,
          description: req.body.description,
          createdBy: {
            connect: {
              id: reqUser.id,
            },
          },
        },
      });
    }

    // Project created successfully
    return res.status(200).send({
      id: project.id,
      name: project.name,
      description: project.description,
      createdBy: reqUser.username,
      message: "Project created successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while creating new project",
    });
  }
};
