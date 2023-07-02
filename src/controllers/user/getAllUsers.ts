import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getAllUsersSchema = z.object({
  query: z.object({
    items: z
      .string({
        invalid_type_error: "Number of items must be of type string",
      })
      .min(1, { message: "Items cannot be less than 1" })
      .optional(),
    page: z
      .string({
        invalid_type_error: "Page number must be of type string",
      })
      .min(1, { message: "Page number cannot be less than 1" })
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
 @desc Request Handler
 */

// Function to validate request using zod schema
export const getAllUsersValidator: RequestHandler = validate(getAllUsersSchema);

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Implement Cursor based pagination after MVP.
    // Figure out how to implement fuzzy search properly.
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

    // Get list of users
    try {
      const users = await prisma.user.findMany({
        skip: maxItems * page,
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
      });

      // Get total count of list of users
      const totalCount = await prisma.user.count({
        where: {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      });

      if (!users) {
        return res.status(404).send({ error: "No users found!" });
      }

      // Send list of users
      res.status(200).send({
        totalPages: totalCount / Math.min(maxItems, totalCount),
        data: users,
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
