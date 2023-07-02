import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getProjectByNameSchema = z.object({
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
 @route GET /api/project/:username/:name
 @desc Request Handler
 */

// Function to validate request using zod schema
export const getProjectByNameValidator: RequestHandler = validate(
  getProjectByNameSchema
);

export const getProjectByName = async (req: Request, res: Response) => {
  try {
    // Check if an account exists with given username
    const user = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });
    if (!user) {
      return res
        .status(404)
        .send({ error: "No user with username provided found!" });
    }

    // Check if project with given name exists
    const project = await prisma.project.findUnique({
      where: {
        projectName: { name: req.params.name, createdById: user.id },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdBy: true,
        members: true,
        tickets: true,
        createdAt: true,
      },
    });
    if (!project) {
      return res
        .status(404)
        .send({ error: "No project with name provided found!" });
    }

    // Send project details
    res.status(200).send({
      data: {
        project,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting project by name",
    });
  }
};
