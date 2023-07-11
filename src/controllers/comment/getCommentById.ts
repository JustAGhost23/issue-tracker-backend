import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getCommentByIdSchema = z.object({
  params: z.object({
    commentId: z.coerce
      .number({
        invalid_type_error: "commentId not a number",
        required_error: "commentId is a required path parameter",
      })
      .positive({
        message: "invalid commentId",
      })
      .int({
        message: "invalid commentId",
      }),
  }),
});

/**
 @route GET /api/comment/:commentId
 @type RequestHandler
 */

// Function to validate request using zod schema
export const getCommentByIdValidator: RequestHandler =
  validate(getCommentByIdSchema);

export const getCommentById = async (req: Request, res: Response) => {
  try {
    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: {
        id: parseInt(req.params.commentId),
      },
      select: {
        id: true,
        text: true,
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            provider: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        ticket: {
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!comment) {
      return res.status(404).send({
        error: "Comment not found",
      });
    }

    // Send comment details
    return res.status(200).send({
      data: {
        comment,
      },
      message: "Comment found",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting comment by id",
    });
  }
};
