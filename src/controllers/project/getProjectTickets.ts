import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getProjectTicketsSchema = z.object({
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
 @route GET /api/project/:username/:name/tickets
 @type RequestHandler
 */

// Function to validate request using zod schema
export const getProjectTicketsValidator: RequestHandler = validate(
  getProjectTicketsSchema
);

export const getProjectTickets = async (req: Request, res: Response) => {
  try {
    const maxItems = parseInt((req.query.items as string) ?? "10");
    const keyword = (req.query.keyword as string) ?? "";

    if (maxItems < 1) {
      return res.status(400).send({ error: "Invalid number of items" });
    }

    if (req.query.cursor) {
      const cursor = parseInt(req.query.cursor as string);
      if (cursor < 0) {
        return res.status(400).send({ error: "Invalid cursor provided" });
      }
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

    try {
      let tickets = null;
      if (req.query.cursor) {
        tickets = await prisma.ticket.findMany({
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
            project: {
              createdBy: {
                username: req.params.username,
              },
              name: req.params.name,
            },
          },
          select: {
            id: true,
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
          orderBy: {
            id: "asc",
          },
        });
      } else {
        tickets = await prisma.ticket.findMany({
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
            id: true,
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
          orderBy: {
            id: "asc",
          },
        });
      }

      if (!tickets) {
        return res.status(404).send({ error: "No projects found" });
      }
      const lastTicket = tickets[tickets.length - 1];
      const myCursor = lastTicket.id;

      // Send list of tickets
      res.status(200).send({
        data: tickets,
        nextCursor: myCursor,
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
