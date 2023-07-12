import { Role, User } from "@prisma/client";
import { Request, RequestHandler, Response } from "express";
import { prisma, redisClient } from "../../config/db.js";
import { getCurrentUser } from "../../middlewares/user.js";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest.js";

// Zod schema to validate request
const deleteUserSchema = z.object({
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
 @route POST /api/user/:username/delete
 @type Request Handler
 */

export const deleteUserValidator: RequestHandler = validate(deleteUserSchema);

export const deleteUser = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    const delUser = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });
    if (!delUser) {
      return res.status(404).send({ error: "User to be deleted not found" });
    }

    // Check if the user owns projects
    const projects = await prisma.project.findMany({
      where: {
        createdById: delUser.id,
      },
    });

    if (user.role !== Role.ADMIN) {
      if (projects) {
        return res.status(409).send({
          error:
            "This user owns projects, please delete them or transfer ownership",
        });
      }

      if (user.id !== delUser.id) {
        return res.status(400).send({
          error:
            "You cannot delete other users as you do not have the admin role",
        });
      }
    } else {
      if (projects) {
        projects.forEach(async (project) => {
          const updateProjects = await prisma.project.update({
            where: {
              id: project.id,
            },
            data: {
              createdBy: {
                connect: {
                  id: user.id,
                },
              },
            },
          });
          if (!updateProjects) {
            return res.status(400).send({
              error:
                "Something went wrong while transferring ownership to admin",
            });
          }
        });
      }
    }

    // Delete user from database
    const deletedUser = await prisma.user.delete({
      where: {
        id: delUser.id,
      },
    });
    if (!deletedUser) {
      res
        .status(500)
        .json({ message: "Something went wrong while deleting user" });
      return;
    }

    // Deleted user successfully
    if (user.id !== delUser.id) {
      res.status(200).send({ message: "Deleted account successfully" });
    } else {
      try {
        await redisClient.set(
          `blacklist_${req.cookies["refresh"]}`,
          req.cookies["refresh"],
          {
            EX: 7 * 24 * 60 * 60,
          }
        );

        res
          .status(200)
          .clearCookie("jwt")
          .clearCookie("refresh")
          .send({ message: "Deleted user successfully" });
      } catch (err) {
        res.status(500).send({
          error: "Something went wrong while deleting user",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting user by username",
    });
  }
};
