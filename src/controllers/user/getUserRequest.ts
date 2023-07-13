import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getUserRequestSchema = z.object({
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
 @route GET /api/user/:username/request
 @type RequestHandler
 */

// Function to validate request using zod schema
export const getUserRequestValidator: RequestHandler =
  validate(getUserRequestSchema);

export const getUserRequest = async (req: Request, res: Response) => {
  try {
    // Check if an account exists with given username
    const user = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Get user request
    const request = await prisma.requests.findUnique({
      where: {
        authorId: user.id,
      },
    });
    if (!request) {
      return res.status(404).send({ error: "Request not found" });
    }

    // Send user details
    res.status(200).send({
      data: {
        request,
      },
      message: "Request found",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting request by username",
    });
  }
};
