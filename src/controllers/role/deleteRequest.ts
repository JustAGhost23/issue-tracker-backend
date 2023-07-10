import { User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";

// Zod schema to validate request
const deleteRequestSchema = z.object({
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
  }),
});

/**
 @route /api/role/request/delete
 @type RequestHandler
 */

export const deleteRequestValidator: RequestHandler =
  validate(deleteRequestSchema);

export const deleteRequest = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    // Check if there is an existing request
    const request = await prisma.requests.findUnique({
      where: {
        authorId: req.body.userId,
      },
    });
    if (!request) {
      return res
        .status(400)
        .send({ error: "No request exists associated with this user" });
    }

    // Check if current user and user whose request is to be deleted are the same
    if (user.id != request.authorId) {
      return res.status(400).send({ error: "User did not make this request" });
    }

    // Delete request
    const deleteRequest = await prisma.requests.delete({
      where: {
        authorId: user.id,
      },
    });
    if (!deleteRequest) {
      return res.status(500).send({
        error: "Something went wrong while deleting role change request",
      });
    }

    return res.status(200).send({ message: "Request deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while deleting role change request",
    });
  }
};
