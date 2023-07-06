import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getUserProjectsSchema = z.object({
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
 @route GET /api/user/:username/projects
 @type Request Handler
 */

// Function to validate request using zod schema
export const getUserProjectsValidator: RequestHandler = validate(
  getUserProjectsSchema
);

export const getUserProjects = async (req: Request, res: Response) => {
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Get list of projects
    try {
      const projects = await prisma.project.findMany({
        skip: maxItems * page,
        take: maxItems,
        where: {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
          members: {
            some: {
              username: req.params.username,
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdBy: {
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
          members: {
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
          tickets: {
            select: {
              name: true,
              description: true,
              priority: true,
              status: true,
            },
          },
          createdAt: true,
        },
      });

      // Get total count of list of projects
      const totalCount = await prisma.project.count({
        where: {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
          members: {
            some: {
              username: req.params.username,
            },
          },
        },
      });

      if (!projects) {
        return res.status(404).send({ error: "No projects found!" });
      }

      // Send list of projects
      res.status(200).send({
        totalPages: totalCount / Math.min(maxItems, totalCount),
        data: projects,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        error: "Something went wrong while getting projects",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting projects",
    });
  }
};
