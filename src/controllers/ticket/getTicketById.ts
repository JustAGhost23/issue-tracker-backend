import { RequestHandler, Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const getTicketByIdSchema = z.object({
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
});

/**
 @route GET /api/ticket/:ticketId
 @desc Request Handler
 */

// Function to validate request using zod schema
export const getTicketByIdValidator: RequestHandler =
  validate(getTicketByIdSchema);

export const getTicketById = async (req: Request, res: Response) => {
  try {
    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: parseInt(req.params.ticketId),
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
    if (!ticket) {
      return res.status(404).send({
        error: "Ticket not found",
      });
    }

    // Send ticket details
    return res.status(200).send({
      data: {
        ticket,
      },
      message: "Ticket found",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while getting ticket by id",
    });
  }
};
