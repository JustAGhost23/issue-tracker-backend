import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getUserByUsernameSchema = z.object({
  params: z.object({
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
 @route GET /api/user/:username
 @type Request Handler
 */

// Function to validate request using zod schema
export const getUserByUsernameValidator: RequestHandler = validate(
  getUserByUsernameSchema
);

export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    // Check if an account exists with given username
    const user = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        provider: true,
        projectsOwned: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        ticketsCreated: true,
        ticketsAssigned: true,
        comments: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res
        .status(404)
        .send({ error: "No user with username provided found!" });
    }

    // Send user details
    res.status(200).send({
      data: {
        user,
      },
      message: "User found"
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting user by username",
    });
  }
};
