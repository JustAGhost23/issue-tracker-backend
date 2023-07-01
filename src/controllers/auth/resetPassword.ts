import { User } from "@prisma/client";
import { Token } from "../../utils/enums";
import { prisma, redisClient } from "../../config/db";
import { RequestHandler, Request, Response } from "express";
import { validate } from "../../utils/zodValidateRequest";
import { hashPassword } from "../../utils/password";
import { z } from "zod";

// Zod schema to validate request
const resetPasswordSchema = z.object({
  body: z.object({
    password: z
      .string({
        invalid_type_error: "Password is not a string",
        required_error: "Password is required",
      })
      .min(8, { message: "Must be at least 8 characters long" })
      .max(32, { message: "Must be at most 32 characters long" }),
  }),
  query: z.object({
    token: z
      .string({
        invalid_type_error: "Token must be a string",
        required_error: "Token is required",
      })
      .min(0, { message: "Token cannot be empty" }),
  }),
});

/**
 @route POST /api/auth/reset-password
 @type RequestHandler
 */

// Function to validate request using zod schema
export const resetPasswordValidator: RequestHandler =
  validate(resetPasswordSchema);

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token: string = req.query.token as string;
    
    // Obtain user from redis using token
    const userString: string | null = await redisClient.get(token);
    await redisClient.del(token);

    if (!userString) {
      return res.status(404).send({ error: "No verification token found" });
    }

    // Check if token used is a password reset token
    const tokenDetails = JSON.parse(userString);
    if (tokenDetails.type != Token.PASSWORD) {
      return res.status(403).send({ error: "Incorrect password reset token" });
    }

    // Check if an account exists with given email
    const foundEmail: User | null = await prisma.user.findUnique({
      where: { email: tokenDetails.email },
    });
    if (!foundEmail) {
      return res.status(404).send({
        error: "Account with this email does not exist.",
      });
    }

    const hashed = await hashPassword(req.body.password)
    foundEmail.password = hashed;

    // Update user with new password
    const user = await prisma.user.update({
      where: {
        id: foundEmail.id,
      },
      data: foundEmail,
    });
    if (!user) {
      return res.status(500).send({ error: "Error while resetting password" });
    }

    // Password changed successfully
    res.status(200).send({
      message: "Password changed successfully.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while resetting password",
    });
  }
};
