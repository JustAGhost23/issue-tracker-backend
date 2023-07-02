import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getAllProjectsSchema = z.object({
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
 @route GET /api/project/
 @desc Request Handler
 */

// Function to validate request using zod schema
export const getAllProjectsValidator: RequestHandler = validate(getAllProjectsSchema);

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    // Implement Cursor based pagination after MVP.
    // Figure out how to implement fuzzy search properly.
    const maxItems = parseInt((req.query.items as string) ?? "10");
    const page = parseInt((req.query.page as string) ?? "1") - 1;
    const keyword = (req.query.keyword as string) ?? "";

    if (page < 0) {
      return res.status(400).send({ error: "Invalid page number provided" });
    }
    if (maxItems < 1) {
      return res.status(400).send({ error: "Invalid number of items" });
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
          tickets: true,
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
