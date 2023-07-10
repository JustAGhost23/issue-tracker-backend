import { User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";
import { sendTicketUnassignedEmail } from "../../middlewares/emailNotifications.js";

// Zod schema to validate request
const unassignTicketSchema = z.object({
  params: z.object({
    ticketId: z.coerce
      .number({
        invalid_type_error: "ticketId not a number",
        required_error: "ticketId is a required path parameter",
      })
      .positive({
        message: "invalid ticketId",
      })
      .int({
        message: "invalid ticketId",
      }),
  }),
  body: z.object({
    projectId: z.coerce
      .number({
        invalid_type_error: "projectId not a number",
        required_error: "projectId is a required path parameter",
      })
      .positive({
        message: "invalid projectId",
      })
      .int({
        message: "invalid projectId",
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
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
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
        id: req.body.projectId,
      },
      include: {
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
    if (
      !project.members.some((element) => {
        if (element.id == user.id) {
          return true;
        }
        return false;
      })
    ) {
      return res
        .status(400)
        .send({ error: "User is not a member of the project" });
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: parseInt(req.params.ticketId),
      },
      include: {
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
    if (
      !ticket.assignees.some((element) => {
        if (element.id == unassignedUser.id) {
          return true;
        }
        return false;
      })
    ) {
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
        assignees: {
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

    try {
      await sendTicketUnassignedEmail(
        project,
        updateTicket,
        unassignedUser.email
      );

      // Email sent successfully
      return res.status(200).send({
        data: {
          newTicket,
        },
        message: "Ticket unassigned successfully",
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while unassigning ticket",
    });
  }
};
