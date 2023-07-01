import { User, Provider } from "@prisma/client";
import { Token } from "../../utils/enums";
import { prisma, redisClient } from "../../config/db";
import { RequestHandler, Request, Response } from "express";
import { validate } from "../../utils/zodValidateRequest";
import { z } from "zod";

// Zod schema to validate request
const verifyEmailSchema = z.object({
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
 @route POST /api/auth/verify-email
 @type RequestHandler
 */

// Function to validate request using zod schema
export const verifyEmailValidator: RequestHandler = validate(verifyEmailSchema);

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token: string = req.query.token as string;

    // Obtain user from redis using token
    const userString: string | null = await redisClient.get(token);
    await redisClient.del(token);

    if (!userString) {
      return res.status(404).send({ error: "No verification token found" });
    }

    // Check if token used is an email verification token
    const tokenDetails = JSON.parse(userString);
    if (tokenDetails.type != Token.EMAIL) {
      return res
        .status(403)
        .send({ error: "Incorrect email verification token" });
    }

    // Check if email is already in use
    const foundEmail: User | null = await prisma.user.findUnique({
      where: { email: tokenDetails.email },
    });
    if (foundEmail) {
      return res.status(409).send({
        error:
          "Another account with this email was just created, please register again",
      });
    }

    // Check if username is already in use
    const foundUsername: User | null = await prisma.user.findUnique({
      where: {
        username: tokenDetails.username,
      },
    });
    if (foundUsername) {
      return res.status(409).send({
        error:
          "Another account with this username was just created, please register again",
      });
    }

    // Create new user
    const user: User = await prisma.user.create({
      data: {
        email: tokenDetails.email,
        username: tokenDetails.username,
        name: tokenDetails.name,
        password: tokenDetails.password,
        provider: [Provider.LOCAL],
      },
    });

    // Verified user created successfully
    res.status(200).send({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        provider: user.provider,
      },
      message: "User registered with verified email address",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while verifying email address",
    });
  }
};
