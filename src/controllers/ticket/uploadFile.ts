import { Request, RequestHandler, Response } from "express";
import { prisma } from "../../config/db.js";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";

// Zod schema to validate request
const uploadFileSchema = z.object({
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
 @route POST /api/ticket/:ticketId/upload
 @type RequestHandler
 */

export const uploadFileValidator: RequestHandler = validate(uploadFileSchema);

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.MulterS3.File;
    if (!file) {
      return res.status(404).send({ error: "File not found" });
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: parseInt(req.params.ticketId),
      },
    });
    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
    }

    const uploadFile = await prisma.files.create({
      data: {
        originalName: file.originalname,
        filename: file.filename,
        location: file.location,
        mimetype: file.mimetype,
        size: file.size,
        ticket: {
          connect: {
            id: parseInt(req.params.ticketId),
          },
        },
      },
    });
    if (!uploadFile) {
      res.status(500).send({
        error: "Something went wrong while inserting file data into database",
      });
    }

    return res.status(200).send({
      data: {
        uploadFile,
      },
      message: "Uploaded file successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Something went wrong while inserting file data into database",
    });
  }
};
