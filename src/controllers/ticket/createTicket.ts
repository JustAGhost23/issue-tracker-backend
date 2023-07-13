import { User, Priority, Status, Ticket, ActivityType } from "@prisma/client";
import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { getCurrentUser } from "../../middlewares/user.js";
import { sendTicketCreatedEmail } from "../../middlewares/emailNotifications.js";

// Zod schema to validate request
const createTicketSchema = z.object({
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
  }),
});

/**
 @route POST /api/ticket/
 @type RequestHandler
 */

export const createTicketValidator: RequestHandler =
  validate(createTicketSchema);

export const createTicket = async (req: Request, res: Response) => {
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
            email: true,
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
          status: Status.OPEN,
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
          status: Status.OPEN,
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
        comments: true,
        files: true,
        number: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const emailIds: string[] = project.members.map((user) => user.email);

    const issueActivity = await prisma.issueActivity.create({
      data: {
        type: ActivityType.CREATED,
        text: `${user.username} created a new ticket: ${ticket.name} in the project: ${project.name}`,
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
      await sendTicketCreatedEmail(issueActivity, project, emailIds);

      // Ticket created successfully
      return res.status(200).send({
        data: {
          newTicket,
        },
        message: "Ticket created successfully",
      });
    } catch (err) {
      return res.status(500).send({ error: err });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while creating new ticket",
    });
  }
};
