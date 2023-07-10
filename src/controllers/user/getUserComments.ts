import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getUserCommentsSchema = z.object({
  params: z.object({
    username: z
      .string({
        invalid_type_error: "Username is not a string",
        required_error: "Username is required",
      })
      .min(8, { message: "Must be at least 8 characters long" })
      .max(20, { message: "Must be at most 20 characters long" }),
  }),
  query: z.object({
    items: z.coerce
      .number({
        invalid_type_error: "Number of items not a number",
      })
      .positive({
        message: "Number of items cannot be negative",
      })
      .int({
        message: "Number of items must be an integer",
      })
      .optional(),
    page: z.coerce
      .number({
        invalid_type_error: "Page number not a number",
      })
      .positive({
        message: "Page number cannot be negative",
      })
      .int({
        message: "Page number must be an integer",
      })
      .optional(),
    keyword: z
      .string({
        invalid_type_error: "Keyword must be of type string",
      })
      .optional(),
  }),
});

/**
 @route GET /api/user/:username/comments
 @desc Request Handler
 */

// Function to validate request using zod schema
export const getUserCommentsValidator: RequestHandler = validate(
  getUserCommentsSchema
);

export const getUserComments = async (req: Request, res: Response) => {
  try {
    // Implement Cursor based pagination after MVP.
    const maxItems = parseInt((req.query.items as string) ?? "10");
    const page = parseInt((req.query.page as string) ?? "1") - 1;
    const keyword = (req.query.keyword as string) ?? "";

    // Add checks for page number and items
    if (page < 0) {
      return res.status(400).send({ error: "Invalid page number provided" });
    }
    if (maxItems < 1) {
      return res.status(400).send({ error: "Invalid number of items" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Get list of comments
    try {
      const comments = await prisma.comment.findMany({
        skip: maxItems * page,
        take: maxItems,
        where: {
          authorId: user.id,
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

      // Get total count of list of comments
      const totalCount = await prisma.comment.count({
        where: {
          authorId: user.id,
        },
      });
      if (!comments) {
        return res.status(404).send({ error: "No comments found!" });
      }

      // Send list of comments
      res.status(200).send({
        totalPages: totalCount / Math.min(maxItems, totalCount),
        data: comments,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        error: "Something went wrong while getting comments",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting comments",
    });
  }
};
