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
    contains: z
      .string({
        invalid_type_error: "Starts with must be of type string",
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
    const contains = (req.query.contains as string) ?? "";

    // Get list of users
    try {
      const users = await prisma.user.findMany({
        skip: maxItems * page,
        take: maxItems,
        where: {
          name: {
            contains: contains,
            mode: "insensitive",
          },
        },
        select: {
          email: true,
          username: true,
          name: true,
        },
      });

      // Get total count of list of users
      const totalCount = await prisma.user.count({
        where: {
          name: {
            contains: contains,
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
