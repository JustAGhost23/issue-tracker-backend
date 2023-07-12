import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getAllRequestsSchema = z.object({
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
 @route GET /api/role/
 @type RequestHandler
 */

// Function to validate request using zod schema
export const getAllRequestsValidator: RequestHandler =
  validate(getAllRequestsSchema);

export const getAllRequests = async (req: Request, res: Response) => {
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

    // Get request list
    try {
      let requests = null;
      if (req.query.cursor) {
        // With cursor
        requests = await prisma.requests.findMany({
          take: maxItems,
          skip: 1,
          cursor: {
            id: parseInt(req.query.cursor as string),
          },
          select: {
            id: true,
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
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            id: "asc",
          },
        });
      } else {
        // Without cursor
        requests = await prisma.requests.findMany({
          take: maxItems,
          select: {
            id: true,
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
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            id: "asc",
          },
        });
      }
      if (requests.length === 0) {
        return res.status(200).send({
          data: requests,
          nextCursor: req.query.cursor,
        });
      }
      // Get cursor parameters
      const lastRequest = requests[requests.length - 1];
      const myCursor = lastRequest.id;

      // Send list of requests
      res.status(200).send({
        data: requests,
        nextCursor: myCursor,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        error: "Something went wrong while getting requests",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting requests",
    });
  }
};
