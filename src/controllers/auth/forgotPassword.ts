import { Token } from "../../utils/enums";
import { prisma, redisClient } from "../../config/db";
import { RequestHandler, Request, Response } from "express";
import { validate } from "../../utils/zodValidateRequest";
import { z } from "zod";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Zod schema to validate request
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        invalid_type_error: "Email is not a string",
        required_error: "Email is required",
      })
      .email({ message: "Must be a valid email ID" })
      .min(0, { message: "Email must be a non empty string" }),
  }),
});

/**
 @route POST /api/auth/forgot
 @type RequestHandler
 */

// Function to validate request using zod schema
export const forgotPasswordValidator: RequestHandler =
  validate(forgotPasswordSchema);

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    // Check if an account exists with given email
    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });
    if (!user) {
      return res
        .status(404)
        .send({ error: "Account with this email does not exist" });
    }

    // Create new password reset token
    const token = crypto.randomBytes(16).toString("hex");
    const newToken = await redisClient.set(
      token,
      JSON.stringify({
        email: req.body.email,
        type: Token.PASSWORD,
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

    // Create and send password reset email to the user
    // Edit this link to link it to the frontend
    const verificationLink = `http://${req.headers.host}/api/auth/reset-password?token=${token}`;

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
      subject: "Password Reset",
      html: `Please click on this <a href="${verificationLink}">link</a> to reset your password. Link is valid for 7 days`,
    };

    transporter
      .sendMail(msg)
      .then(() => {
        console.log("Email sent successfully");
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).send({
          error: "Something went wrong while sending password recovery email",
        });
      });

    // Email sent successfully
    res.status(200).send({
      message: "Email sent successfully.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while sending password recovery email",
    });
  }
};
