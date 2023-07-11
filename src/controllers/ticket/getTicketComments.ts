import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getTicketCommentsSchema = z.object({
  params: z.object({
    ticketId: z.coerce
      .number({
        invalid_type_error: "ticketId not a number",
        required_error: "ticketId is a required path parameter",
      })
      .positive({
        message: "invalid ticketId",
      })
      .int({
        message: "invalid ticketId",
      }),
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
    keyword: z
      .string({
        invalid_type_error: "Keyword must be of type string",
      })
      .optional(),
  }),
});

/**
 @route GET /api/ticket/:ticketId/comments
 @desc Request Handler
 */

// Function to validate request using zod schema
export const getTicketCommentsValidator: RequestHandler = validate(
  getTicketCommentsSchema
);

export const getTicketComments = async (req: Request, res: Response) => {
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

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: parseInt(req.params.ticketId),
      },
    });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
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
            ticketId: ticket.id,
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
            ticketId: ticket.id,
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
      if (!comments) {
        return res.status(404).send({ error: "No comments found" });
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
