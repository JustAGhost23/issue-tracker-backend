import { User } from "@prisma/client";
import { Token } from "../../utils/enums";
import { prisma, redisClient } from "../../config/db";
import { RequestHandler, Request, Response } from "express";
import { validate } from "../../utils/zodValidateRequest";
import { hashPassword } from "../../utils/password";
import { z } from "zod";
import nodemailer from "nodemailer";
import crypto from "crypto";

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

    // Hash password
    const hashed = await hashPassword(req.body.password);

    // Create new email verification token
    const token = crypto.randomBytes(16).toString("hex");
    const newToken = await redisClient.set(
      token,
      JSON.stringify({
        email: req.body.email,
        username: req.body.username,
        name: req.body.name,
        password: hashed,
        type: Token.EMAIL,
      }),
      {
        EX: 60 * 60,
      }
    );
    if (!newToken) {
      return res.status(500).send({
        error: "Something went wrong while creating token",
      });
    }

    // Create and send verification email to the user
    // TODO: Edit this link to link it to the frontend
    const verificationLink = `http://${req.headers.host}/api/auth/verify-email?token=${token}`;

    const config = {
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_MAIL_USER!,
        pass: process.env.GOOGLE_MAIL_PASSWORD!,
      },
    };
    const transporter = nodemailer.createTransport(config);
    const msg = {
      from: "issuetracker@gmail.com",
      to: req.body.email,
      subject: "Email Verification",
      html: `Please click on this <a href="${verificationLink}">link</a> within the next 1 hour to verify your account on issue-tracker.`,
    };

    transporter
      .sendMail(msg)
      .then(() => {
        console.log("Email sent successfully");
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).send({
          error: "Something went wrong while sending verification email",
        });
      });

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
