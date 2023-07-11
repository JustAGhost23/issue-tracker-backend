import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getAllUsersSchema = z.object({
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
 @route GET /api/user/
 @type Request Handler
 */

// Function to validate request using zod schema
export const getAllUsersValidator: RequestHandler = validate(getAllUsersSchema);

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Get maxItems and keyword
    const maxItems = parseInt((req.query.items as string) ?? "10");
    const keyword = (req.query.keyword as string) ?? "";

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

    // Get user list
    try {
      let users = null;
      if (req.query.cursor) {
        // With cursor
        users = await prisma.user.findMany({
          take: maxItems,
          skip: 1,
          cursor: {
            id: parseInt(req.query.cursor as string),
          },
          where: {
            name: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            provider: true,
            role: true,
            projectsOwned: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            projects: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            ticketsCreated: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            ticketsAssigned: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            comments: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            id: "asc",
          },
        });
      } else {
        // Without cursor
        users = await prisma.user.findMany({
          take: maxItems,
          where: {
            name: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            provider: true,
            role: true,
            projectsOwned: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            projects: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            ticketsCreated: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            ticketsAssigned: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            comments: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            id: "asc",
          },
        });
      }
      if (!users) {
        return res.status(404).send({ error: "No users found" });
      }
      // Get cursor parameters
      const lastUser = users[users.length - 1];
      const myCursor = lastUser.id;

      // Send list of users
      res.status(200).send({
        data: users,
        nextCursor: myCursor,
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
      error: "Something went wrong while getting users",
    });
  }
};
