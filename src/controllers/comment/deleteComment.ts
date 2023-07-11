import { Role, User } from "@prisma/client";
import { Request, RequestHandler, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";

// Zod schema to validate request
const deleteCommentSchema = z.object({
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
 @route POST /api/comment/:commentId/delete
 @type RequestHandler
 */

// Function to validate request using zod schema
export const deleteCommentValidator: RequestHandler =
  validate(deleteCommentSchema);

export const deleteComment = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: {
        id: parseInt(req.params.commentId),
      },
    });
    if (!comment) {
      return res.status(404).send({ error: "Comment not found" });
    }

    if (user.role !== Role.ADMIN) {
      // Check if user made the comment
      if (user.id !== comment.authorId) {
        return res
          .status(403)
          .send({ error: "User cannot delete a comment made by someone else" });
      }
    }

    // Delete comment from database
    const deletedComment = await prisma.comment.delete({
      where: {
        id: parseInt(req.params.commentId),
      },
    });
    if (!deletedComment) {
      res
        .status(500)
        .json({ message: "Something went wrong while deleting comment" });
      return;
    }

    res.status(200).send({ message: "Deleted comment successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while deleting comment",
    });
  }
};
