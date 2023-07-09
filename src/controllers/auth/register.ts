import { User } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { RequestHandler, Request, Response } from "express";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { sendVerificationEmail } from "../../middlewares/emailNotifications.js";

// Zod schema to validate request
const createUserSchema = z.object({
  body: z.object({
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
      .min(0, { message: "Name cannot be empty" })
      .max(60, { message: "Name can be at most 60 characters long" }),
    email: z
      .string({
        invalid_type_error: "Email is not a string",
        required_error: "Email is required",
      })
      .email({ message: "Must be a valid email ID" })
      .min(0, { message: "Email must be a non empty string" }),
    password: z
      .string({
        invalid_type_error: "Password is not a string",
        required_error: "Password is required",
      })
      .min(8, { message: "Must be at least 8 characters long" })
      .max(32, { message: "Must be at most 32 characters long" }),
  }),
});

/**
 @route POST /api/auth/register
 @type RequestHandler
 */

// Function to validate request using zod schema
export const registerValidator: RequestHandler = validate(createUserSchema);

export const register = async (req: Request, res: Response) => {
  try {
    // Check if email is already in use
    const foundEmail: User | null = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (foundEmail) {
      return res
        .status(409)
        .send({ error: "Another account with this email already exists." });
    }

    // Check if username is already in use
    const foundUsername: User | null = await prisma.user.findUnique({
      where: {
        username: req.body.username,
      },
    });
    if (foundUsername) {
      return res
        .status(409)
        .send({ error: "Another account with this username already exists" });
    }

    await sendVerificationEmail(req, res);

    // Email sent successfully
    res.status(200).send({
      data: {
        message: "Email sent successfully",
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while registering",
    });
  }
};
