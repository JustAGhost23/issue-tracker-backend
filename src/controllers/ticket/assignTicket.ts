import { User, Priority, Status, Ticket } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const assignTicketSchema = z.object({
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
    ids: z.coerce
      .number({
        invalid_type_error: "ids not a number",
        required_error: "ids is a required path parameter",
      })
      .positive({
        message: "invalid id",
      })
      .int({
        message: "invalid id",
      })
      .array(),
  }),
});

/**
 * @route POST /api/ticket/:ticketId/assign
 * @type RequestHandler
 */

export const assignTicketValidator: RequestHandler =
  validate(assignTicketSchema);

export const assignTicket = async (req: Request, res: Response) => {
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
      select: {
        id: true,
        assignees: {
          select: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
    }

    const assignedUserIds = req.body.ids;

    const assignedUserIdsToAssign: number[] = assignedUserIds.filter(
      (userId: number) =>
        !ticket?.assignees.some(
          (assignedUser) => assignedUser.user.id === userId
        )
    );

    // Assign users to ticket
    const updateTicket = await prisma.ticket.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        assignees: {
          create: assignedUserIdsToAssign.map((id) => ({
            user: {
              connect: {
                id,
              },
            },
          })),
        },
      },
    });
    if (!updateTicket) {
      return res
        .status(500)
        .send({ error: "Something went wrong while assigning users" });
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

    // Ticket assigned successfully
    return res.status(200).send({
      data: {
        newTicket,
      },
      message: "Ticket assigned to assignees successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while assigning ticket",
    });
  }
};
