import { User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const unassignTicketSchema = z.object({
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
    userId: z.coerce
      .number({
        invalid_type_error: "userIds not a number",
        required_error: "userIds is a required path parameter",
      })
      .positive({
        message: "invalid userId",
      })
      .int({
        message: "invalid userId",
      }),
  }),
});

/**
 * @route POST /api/ticket/:ticketId/unassign
 * @type RequestHandler
 */

export const unassignTicketValidator: RequestHandler =
  validate(unassignTicketSchema);

export const unassignTicket = async (req: Request, res: Response) => {
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

    // Check if user to be unassigned exists
    const unassignedUser = await prisma.user.findFirst({
      where: {
        id: parseInt(req.body.userId),
      },
    });
    if (!unassignedUser) {
      return res.status(404).send({ error: "User to be unassigned not found" });
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
      select: {
        id: true,
        assignees: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
    }

    // Check if the user has been assigned this ticket
    if (!(unassignedUser.id in ticket.assignees)) {
      return res
        .status(400)
        .send({ error: "User has not been assigned this ticket" });
    }

    // Unassign user from ticket
    const updateTicket = await prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        assignees: {
          disconnect: {
            id: unassignedUser.id,
          },
        },
      },
    });
    if (!updateTicket) {
      return res
        .status(500)
        .send({ error: "Something went wrong while unassigning user" });
    }

    const newTicket = await prisma.ticket.findUnique({
      where: {
        id: updateTicket.id,
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

    // Ticket unassigned successfully
    return res.status(200).send({
      data: {
        newTicket,
      },
      message: "Ticket unassigned successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while unassigning ticket",
    });
  }
};