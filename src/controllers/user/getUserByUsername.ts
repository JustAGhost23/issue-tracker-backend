import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db";
import { validate } from "../../utils/zodValidateRequest";
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
 @desc Request Handler
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
    });
    if (!user) {
      return res
        .status(404)
        .send({ error: "No user with username provided found!" });
    }

    // Send user details
    res.status(200).send({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting user by username",
    });
  }
};
