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
    cursor: z.coerce
      .number({
        invalid_type_error: "Cursor not a number",
      })
      .positive({
        message: "Cursor cannot be negative",
      })
      .int({
        message: "Cursor must be an integer",
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
    // Get maxItems
    const maxItems = parseInt((req.query.items as string) ?? "10");

    if (maxItems < 1) {
      return res.status(400).send({ error: "Invalid number of items" });
    }

    // Check if cursor is valid
    if (req.query.cursor) {
      const cursor = parseInt(req.query.cursor as string);
      if (cursor < 0) {
        return res.status(400).send({ error: "Invalid cursor provided" });
      }
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

    // Get comment list
    try {
      let comments = null;
      if (req.query.cursor) {
        // With cursor
        comments = await prisma.comment.findMany({
          take: maxItems,
          skip: 1,
          cursor: {
            id: parseInt(req.query.cursor as string),
          },
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
          orderBy: {
            id: "asc",
          },
        });
      } else {
        // Without cursor
        comments = await prisma.comment.findMany({
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
          orderBy: {
            id: "asc",
          },
        });
      }
      if (comments.length === 0) {
        return res.status(200).send({
          data: comments,
          nextCursor: req.query.cursor,
        });
      }
      // Get cursor parameters
      const lastComment = comments[comments.length - 1];
      const myCursor = lastComment.id;

      // Send list of comments
      res.status(200).send({
        data: comments,
        nextCursor: myCursor,
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
