import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getAllTicketsOfProjectSchema = z.object({
  params: z.object({
    username: z
      .string({
        invalid_type_error: "Username is not a string",
        required_error: "Username is required",
      })
      .min(8, { message: "Must be at least 8 characters long" })
      .max(20, { message: "Must be at most 20 characters long" }),
    name: z
      .string({
        invalid_type_error: "Name is not a string",
        required_error: "Name is required",
      })
      .min(4, { message: "Must be atleast 4 characters long" })
      .max(60, { message: "Must be atmost 60 characters long" })
      .refine(
        (s) => {
          return !s.trimStart().trimEnd().includes(" ");
        },
        (s) => ({
          message: `${s} is not a valid project name, please remove the whitespaces`,
        })
      )
      .refine(
        (s) => {
          return !/[A-Z]/.test(s);
        },
        (s) => ({
          message: `${s} is not a valid project name, please remove the capital letters`,
        })
      ),
  }),
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
 @route GET /api/ticket/:username/:name
 @desc Request Handler
 */

// Function to validate request using zod schema
export const getAllTicketsOfProjectValidator: RequestHandler = validate(
  getAllTicketsOfProjectSchema
);

export const getAllTicketsOfProject = async (req: Request, res: Response) => {
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

    // Check if project owner exists
    const projectOwner = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });
    if (!projectOwner) {
      return res.status(404).send({ error: "Project owner not found" });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: {
        projectName: { name: req.params.name, createdById: projectOwner.id },
      },
    });
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    // Get list of tickets
    try {
      const tickets = await prisma.ticket.findMany({
        skip: maxItems * page,
        take: maxItems,
        where: {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
          project: {
            createdBy: {
              username: req.params.username,
            },
            name: req.params.name,
          },
        },
        select: {
          name: true,
          description: true,
          priority: true,
          status: true,
          project: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          reportedBy: {
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
          number: true,
        },
      });

      // Get total count of list of tickets
      const totalCount = await prisma.ticket.count({
        where: {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
          project: {
            createdBy: {
              username: req.params.username,
            },
            name: req.params.name,
          },
        },
      });

      if (!tickets) {
        return res.status(404).send({ error: "No tickets found!" });
      }

      // Send list of tickets
      res.status(200).send({
        totalPages: totalCount / Math.min(maxItems, totalCount),
        data: tickets,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        error: "Something went wrong while getting tickets",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting tickets",
    });
  }
};
