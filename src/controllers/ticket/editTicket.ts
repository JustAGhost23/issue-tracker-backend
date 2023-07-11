import { User, Priority, Status, Ticket, ActivityType } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";
import { sendTicketEditedEmail } from "../../middlewares/emailNotifications.js";

// Zod schema to validate request
const editTicketSchema = z.object({
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
 @route POST /api/ticket/:ticketId/edit
 @type RequestHandler
 */

export const editTicketValidator: RequestHandler = validate(editTicketSchema);

export const editTicket = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
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
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: parseInt(req.params.ticketId),
      },
      include: {
        reportedBy: {
          select: {
            email: true,
          },
        },
        assignees: {
          select: {
            email: true,
          },
        },
      },
    });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
    }

    // Edit ticket
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
            role: true,
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
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        number: true,
      },
    });

    const emailIds = ticket.assignees.map((assignee) => assignee.email);
    emailIds.push(ticket.reportedBy.email);

    const issueActivity = await prisma.issueActivity.create({
      data: {
        type: ActivityType.UPDATED,
        text: `${user.username} made changes to the ticket: ${ticket.name} in the project: ${project.name}.`,
        ticket: {
          connect: {
            id: ticket.id,
          },
        },
        author: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    try {
      await sendTicketEditedEmail(issueActivity, ticket, emailIds);

      // Ticket edited successfully
      return res.status(200).send({
        data: {
          outTicket,
        },
        message: "Ticket edited successfully",
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while editing ticket",
    });
  }
};
