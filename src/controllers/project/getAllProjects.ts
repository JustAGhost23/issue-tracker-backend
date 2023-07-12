import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getAllProjectsSchema = z.object({
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
 @route GET /api/project/
 @type RequestHandler
 */

// Function to validate request using zod schema
export const getAllProjectsValidator: RequestHandler =
  validate(getAllProjectsSchema);

export const getAllProjects = async (req: Request, res: Response) => {
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

    // Get project list
    try {
      let projects = null;
      if (req.query.cursor) {
        // With cursor
        projects = await prisma.project.findMany({
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
            name: true,
            description: true,
            createdBy: {
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
            members: {
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
            tickets: {
              select: {
                name: true,
                description: true,
                priority: true,
                status: true,
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
        projects = await prisma.project.findMany({
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
                role: true,
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
                role: true,
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
            updatedAt: true,
          },
          orderBy: {
            id: "asc",
          },
        });
      }
      if (projects.length === 0) {
        return res.status(200).send({
          data: projects,
          nextCursor: req.query.cursor,
        });
      }
      // Get cursor parameters
      const lastProject = projects[projects.length - 1];
      const myCursor = lastProject.id;

      // Send list of projects
      res.status(200).send({
        data: projects,
        nextCursor: myCursor,
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
