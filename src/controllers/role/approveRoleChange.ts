import { User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";
import { sendApprovedRoleChangeMail } from "../../middlewares/emailNotifications.js";

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
    requestId: z.coerce
      .number({
        invalid_type_error: "requestId not a number",
        required_error: "requestId is a required path parameter",
      })
      .positive({
        message: "invalid requestId",
      })
      .int({
        message: "invalid requestId",
      }),
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

    // Get request
    const request = await prisma.requests.findUnique({
      where: {
        id: req.body.requestId,
      },
    });
    if (!request) {
      return res.status(404).send({ error: "Request not found" });
    }

    updatedUser.role = request.role;
    const updateUser = await prisma.user.update({
      where: {
        id: updatedUser.id,
      },
      data: updatedUser,
    });

    // Delete request
    const deleteRequest = await prisma.requests.delete({
      where: {
        id: request.id,
      },
    });
    if (!deleteRequest) {
      return res
        .status(400)
        .send({ error: "Error occured while deleting request" });
    }

    try {
      await sendApprovedRoleChangeMail(request, updateUser.email);

      // Email sent successfully
      return res.status(200).send({
        message: "User role updated successfully",
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while updating user roles",
    });
  }
};
