import { Role, User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";

// Zod schema to validate request
const approveRoleChangeSchema = z.object({
  body: z.object({
    userId: z.coerce
      .number({
        invalid_type_error: "userId not a number",
        required_error: "userId is a required path parameter",
      })
      .positive({
        message: "invalid userId",
      })
      .int({
        message: "invalid userId",
      }),
    role: z.nativeEnum(Role),
  }),
});

/**
 @route POST /api/role/request/approve
 @type RequestHandler
 */

export const approveRoleChangeValidator: RequestHandler = validate(
  approveRoleChangeSchema
);

export const approveRoleChange = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    // Get user whose role is to be updated
    const updatedUser = await prisma.user.findUnique({
      where: {
        id: req.body.userId,
      },
    });
    if (!updatedUser) {
      return res.status(404).send({ error: "User to be updated not found" });
    }

    updatedUser.role = req.body.role;
    const updateUser = await prisma.user.update({
      where: {
        id: updatedUser.id,
      },
      data: updatedUser,
    });

    // Add email notif here

    return res.status(200).send({ message: "User role updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while updating user roles",
    });
  }
};
