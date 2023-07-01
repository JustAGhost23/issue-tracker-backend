import { User } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../../config/db";

/**
 @route POST /api/user/delete
 @desc Request Handler
 */

export const deleteCurrentUser = async (req: Request, res: Response) => {
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

    // Delete user from database
    const deletedUser = await prisma.user.delete({
      where: {
        id: reqUser.id,
      },
    });
    if (!user) {
      res
        .status(500)
        .json({ message: "Something went wrong while deleting user" });
      return;
    }

    // Clear JWT Token
    res
      .status(200)
      .clearCookie("jwt")
      .send({ message: "Deleted account successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting user by username",
    });
  }
};
