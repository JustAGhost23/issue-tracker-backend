import { User, Priority, Status, Ticket } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const editTicketSchema = z.object({
  params: z.object({
    ticketId: z.coerce
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
  }),
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
 * @route POST /api/ticket/:ticketId/edit
 * @type RequestHandler
 */

export const editTicketValidator: RequestHandler = validate(editTicketSchema);

export const editTicket = async (req: Request, res: Response) => {
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

    // Check if ticket exists
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: parseInt(req.params.ticketId),
      },
    });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
    }

    // Create new ticket
    let newTicket: Ticket | null;
    if (!req.body.description) {
      newTicket = await prisma.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          name: req.body.name,
          priority: req.body.priority,
          status: req.body.status,
        },
      });
    } else {
      newTicket = await prisma.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          name: req.body.name,
          description: req.body.description,
          priority: req.body.priority,
          status: req.body.status,
        },
      });
    }
    if (!newTicket) {
      return res
        .status(500)
        .send({ error: "Something went wrong while creating new ticket" });
    }

    const outTicket = await prisma.ticket.findUnique({
      where: {
        id: newTicket.id,
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

    // Ticket edited successfully
    return res.status(200).send({
      data: {
        outTicket,
      },
      message: "Ticket edited successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while editing ticket",
    });
  }
};
