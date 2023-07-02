import { User, Priority, Status, Ticket } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const createTicketSchema = z.object({
  body: z.object({
    id: z.coerce
      .number({
        invalid_type_error: "id not a number",
        required_error: "id is a required path parameter",
      })
      .positive({
        message: "invalid id",
      })
      .int({
        message: "invalid id",
      }),
    name: z
      .string({
        invalid_type_error: "Name is not a string",
        required_error: "Name is required",
      })
      .min(4, { message: "Must be atleast 4 characters long" })
      .max(100, { message: "Must be atmost 100 characters long" }),
    description: z
      .string({
        invalid_type_error: "Description must be of type string",
      })
      .optional(),
    priority: z.nativeEnum(Priority),
    status: z.nativeEnum(Status),
  }),
});

/**
 * @route POST /api/ticket/
 * @type RequestHandler
 */

export const createTicketValidator: RequestHandler =
  validate(createTicketSchema);

export const createTicket = async (req: Request, res: Response) => {
  try {
    // Check if user is valid
    const reqUser = req.user as User;
    if (!reqUser) {
      return res.status(400).send({ error: "Invalid user sent in request" });
    }
    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: reqUser.id,
      },
    });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Check if project exists
    const project = await prisma.project.findFirst({
      where: {
        id: req.body.id,
      },
      select: {
        id: true,
        members: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    // Check if user is a member of the project
    if (user.id in project.members) {
      res.status(400).send({ error: "User is not a member of the project" });
    }

    // Get number of existing tickets in the project
    const totalTickets = await prisma.ticket.count({
      where: {
        projectId: project.id,
      },
    });

    // Create new ticket
    let ticket: Ticket | null;
    if (!req.body.description) {
      ticket = await prisma.ticket.create({
        data: {
          name: req.body.name,
          priority: req.body.priority,
          status: req.body.status,
          project: {
            connect: {
              id: project.id,
            },
          },
          reportedBy: {
            connect: {
              id: user.id,
            },
          },
          number: totalTickets + 1,
        },
      });
    } else {
      ticket = await prisma.ticket.create({
        data: {
          name: req.body.name,
          description: req.body.description,
          priority: req.body.priority,
          status: req.body.status,
          project: {
            connect: {
              id: project.id,
            },
          },
          reportedBy: {
            connect: {
              id: user.id,
            },
          },
          number: totalTickets + 1,
        },
      });
    }
    if (!ticket) {
      return res
        .status(500)
        .send({ error: "Something went wrong while creating new ticket" });
    }

    const newTicket = await prisma.ticket.findUnique({
      where: {
        id: ticket.id,
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

    // Ticket created successfully
    return res.status(200).send({
      data: {
        newTicket,
      },
      message: "Ticket created successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while creating new ticket",
    });
  }
};
