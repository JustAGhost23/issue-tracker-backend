import { ActivityType, Status, User } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { sendTicketAssignedEmail } from "../../middlewares/emailNotifications.js";
import { getCurrentUser } from "../../middlewares/user.js";

// Zod schema to validate request
const assignTicketSchema = z.object({
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
        invalid_type_error: "userId not a number",
        required_error: "userId is a required path parameter",
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
 @route POST /api/ticket/:ticketId/assign
 @type RequestHandler
 */

export const assignTicketValidator: RequestHandler =
  validate(assignTicketSchema);

export const assignTicket = async (req: Request, res: Response) => {
  try {
    // Get current User
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: user.message });
    }

    // Get user to be assigned
    const assignedUser = await prisma.user.findUnique({
      where: {
        id: req.body.userId,
      },
      select: {
        id: true,
        email: true,
      },
    });
    if (!assignedUser) {
      return res.status(404).send({ error: "User to be assigned not found" });
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
        assignees: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
    }

    // Check if user to be assigned is a member of the project
    if (
      !project.members.some((element) => {
        if (element.id == assignedUser.id) {
          return true;
        }
        return false;
      })
    ) {
      return res.status(400).send({
        error: "User to be assigned is not a member of the project",
      });
    }

    // Check if the user has been assigned this ticket
    if (
      !ticket.assignees.some((element) => {
        if (element.id == assignedUser.id) {
          return true;
        }
        return false;
      })
    ) {
      return res
        .status(400)
        .send({ error: "User has not been assigned this ticket" });
    }

    const assignedEmailId = assignedUser.email;

    // Assign users to ticket
    const updateTicket = await prisma.ticket.update({
      where: {
        id: parseInt(req.params.ticketId),
      },
      data: {
        status: Status.ASSIGNED,
        assignees: {
          connect: {
            id: assignedUser.id,
          },
        },
      },
    });
    if (!updateTicket) {
      return res
        .status(500)
        .send({ error: "Something went wrong while assigning user" });
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
        comments: true,
        files: true,
        number: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const issueActivity = await prisma.issueActivity.create({
      data: {
        type: ActivityType.ASSIGNED,
        text: `${user.username} assigned you the following ticket: ${ticket.name} in the project: ${project.name}`,
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
      await sendTicketAssignedEmail(
        issueActivity,
        updateTicket,
        assignedEmailId
      );

      // Email sent successfully
      return res.status(200).send({
        data: {
          newTicket,
        },
        message: "Ticket assigned to assignees successfully",
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while assigning ticket",
    });
  }
};
