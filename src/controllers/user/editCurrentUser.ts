import { User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { hashPassword } from "../../utils/password.js";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Zod schema to validate request
const editCurrentUserSchema = z.object({
  body: z.object({
    username: z
      .string({
        invalid_type_error: "Username is not a string",
        required_error: "Username is required",
      })
      .min(8, { message: "Must be at least 8 characters long" })
      .max(20, { message: "Must be at most 20 characters long" })
      .optional(),
    name: z
      .string({
        invalid_type_error: "Name is not a string",
        required_error: "Name is required",
      })
      .min(0, { message: "Name cannot be empty" })
      .max(60, { message: "Name can be at most 60 characters long" })
      .optional(),
    password: z
      .string({
        invalid_type_error: "Password is not a string",
        required_error: "Password is required",
      })
      .min(8, { message: "Must be at least 8 characters long" })
      .max(32, { message: "Must be at most 32 characters long" })
      .optional(),
  }),
});

/**
 @route POST /api/user/edit
 @type Request Handler
 */

// Function to validate request using zod schema
export const editCurrentUserValidator: RequestHandler = validate(
  editCurrentUserSchema
);

export const editCurrentUser = async (req: Request, res: Response) => {
  try {
    // Check if user is valid
    const reqUser = req.user as User;
    if (!reqUser) {
      return res.status(400).send({ error: "Invalid user sent in request" });
    }
    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: reqUser.id,
      },
    });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    if (req.body.username) {
      if (req.body.username != user.username) {
        // Check if username is already in use
        if (req.body.username) {
          const foundUser = await prisma.user.findFirst({
            where: {
              username: req.body.username,
            },
          });
          if (foundUser) {
            return res.status(409).send({
              error: "Another account with this username already exists",
            });
          }
        }
      }
    }

    // Update user details
    if (req.body.name) {
      user.name = req.body.name;
    }
    if (req.body.username) {
      user.username = req.body.username;
    }
    if (req.body.password) {
      const hashed = await hashPassword(req.body.password);
      user.password = hashed;
    }

    const newUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: user,
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
    if (!newUser) {
      return res.status(500).send({ error: "Error while editing user" });
    }

    // Create JWT Token
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.TOKEN_SECRET!,
      { expiresIn: "12h" }
    );

    // Send new JWT token
    res
      .status(200)
      .clearCookie("jwt")
      .cookie("jwt", token, { maxAge: 12 * 60 * 60 * 1000, httpOnly: true })
      .send({
        data: {
          newUser,
        },
        message: "Edited user and updated JWT successfully",
      });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while editing user",
    });
  }
};
