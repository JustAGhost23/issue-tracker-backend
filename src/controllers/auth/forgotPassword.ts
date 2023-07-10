import { prisma } from "../../config/db.js";
import { RequestHandler, Request, Response } from "express";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { sendForgotPasswordEmail } from "../../middlewares/emailNotifications.js";

// Zod schema to validate request
const forgotPasswordSchema = z.object({
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

    try {
      await sendForgotPasswordEmail(user);

      // Email sent successfully
      return res.status(200).send({
        message: "Email sent successfully.",
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while sending password recovery email",
    });
  }
};
