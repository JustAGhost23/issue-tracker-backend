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
  }),
});

/**
 @route GET /api/role/
 @type Request Handler
 */

// Function to validate request using zod schema
export const getAllRequestsValidator: RequestHandler =
  validate(getAllRequestsSchema);

export const getAllRequests = async (req: Request, res: Response) => {
  try {
    // Implement Cursor based pagination after MVP.
    const maxItems = parseInt((req.query.items as string) ?? "10");
    const page = parseInt((req.query.page as string) ?? "1") - 1;

    // Add checks for page number and items
    if (page < 0) {
      return res.status(400).send({ error: "Invalid page number provided" });
    }
    if (maxItems < 1) {
      return res.status(400).send({ error: "Invalid number of items" });
    }

    // Get list of requests
    try {
      const requests = await prisma.requests.findMany({
        skip: maxItems * page,
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
            },
          },
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Get total count of list of requests
      const totalCount = await prisma.requests.count({});

      if (!requests) {
        return res.status(404).send({ error: "No requests found!" });
      }
      res.status(200).send({
        totalPages: totalCount / Math.min(maxItems, totalCount),
        data: requests,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        error: "Something went wrong while getting users",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting requests",
    });
  }
};
