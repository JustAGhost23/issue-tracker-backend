import { Role, User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma, redisClient } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { hashPassword } from "../../utils/password.js";
import { z } from "zod";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../middlewares/generateToken.js";
import { getCurrentUser } from "../../middlewares/user.js";

// Zod schema to validate request
const editUserSchema = z.object({
  params: z.object({
    username: z
      .string({
        invalid_type_error: "Username is not a string",
        required_error: "Username is required",
      })
      .min(8, { message: "Must be at least 8 characters long" })
      .max(20, { message: "Must be at most 20 characters long" }),
  }),
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
 @route POST /api/user/:username/edit
 @type Request Handler
 */

// Function to validate request using zod schema
export const editUserValidator: RequestHandler = validate(editUserSchema);

export const editUser = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    const updateUser = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });
    if (!updateUser) {
      return res.status(404).send({ error: "User to be updated not found" });
    }

    if (user.role !== Role.ADMIN) {
      if (user.id !== updateUser.id) {
        return res.status(400).send({
          error:
            "You cannot edit other users as you do not have the admin role",
        });
      }

      if (req.body.password) {
        const hashed = await hashPassword(req.body.password);
        updateUser.password = hashed;
      }
    } else {
      if (req.body.password) {
        return res
          .status(400)
          .send({ error: "Cannot edit other users passwords" });
      }

      if (updateUser.role === Role.ADMIN && user.id !== updateUser.id) {
        return res
          .status(400)
          .send({ error: "Admins cannot be edited by other admins" });
      }
    }

    if (req.body.username) {
      if (req.body.username != updateUser.username) {
        // Check if username is already in use
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

    // Update user details
    if (req.body.name) {
      updateUser.name = req.body.name;
    }
    if (req.body.username) {
      updateUser.username = req.body.username;
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
    if (!newUser) {
      return res.status(500).send({ error: "Error while editing user" });
    }

    if (user.id !== newUser.id) {
      res.status(200).send({ message: "Edited user successfully" });
    } else {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res
        .status(200)
        .clearCookie("jwt")
        .clearCookie("refresh")
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
          message: "Edited user successfully",
        });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while editing user",
    });
  }
};
