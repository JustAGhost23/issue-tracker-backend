import { Role, User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";

// Zod schema to validate request
const requestRoleChangeSchema = z.object({
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
 @route POST /api/role/request
 @type RequestHandler
 */

export const requestRoleChangeValidator: RequestHandler = validate(
  requestRoleChangeSchema
);

export const requestRoleChange = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    // Check if user has the same role as the one requested to be changed to
    if (req.body.role == user.role) {
      res.status(400).send({ error: "User already has this role" });
    }

    // Add request
    const request = await prisma.requests.create({
      data: {
        author: {
          connect: {
            id: user.id,
          },
        },
        role: req.body.role,
      },
    });
    if (!request) {
      return res
        .status(500)
        .send({ error: "Something went wrong while requesting role change" });
    }

    return res.status(200).send({ message: "Request sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while requesting role change",
    });
  }
};
