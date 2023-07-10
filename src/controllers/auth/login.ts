import { User, Provider } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { RequestHandler, Request, Response } from "express";
import { validate } from "../../utils/zodValidateRequest.js";
import { verifyPassword } from "../../utils/password.js";
import { z } from "zod";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../middlewares/generateToken.js";

// Zod schema to validate request
const loginUserSchema = z.object({
  body: z.object({
    email: z
      .string({
        invalid_type_error: "Email is not a string",
        required_error: "Email is required",
      })
      .email({ message: "Invalid email or password" }),
    password: z
      .string({
        invalid_type_error: "Password is not a string",
        required_error: "Password is required",
      })
      .min(8, { message: "Password is too small" }),
  }),
});

/**
 @route POST /api/auth/login
 @type RequestHandler
 */

// Function to validate request using zod schema
export const loginValidator: RequestHandler = validate(loginUserSchema);

export const login = async (req: Request, res: Response) => {
  try {
    // Check if an account exists with given email
    const user: User | null = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (!user) {
      return res
        .status(404)
        .send({ error: "Account with this email does not exist" });
    }

    // Check if correct auth method is used
    if (!user.password || !user.provider.includes(Provider.LOCAL)) {
      return res.status(404).send({
        error: "Unknown auth method, please try logging in with Google",
      });
    }

    // Verify password
    const validPassword = await verifyPassword(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(403).send({ error: "Incorrect password" });
    }

    const newUser = await prisma.user.findUnique({
      where: {
        email: user.email,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        provider: true,
        role: true,
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
        ticketsCreated: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        ticketsAssigned: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        comments: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200)
    .cookie("jwt", accessToken, {
      maxAge: 30 * 60 * 1000,
      httpOnly: true,
    })
    .cookie("refresh", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    })
    .send({
      data: {
        newUser,
      },
      message: "Logged in successfully",
    });
  } catch (err) {
    res.status(500).send({
      error: "Something went wrong while logging in",
    });
  }
};
