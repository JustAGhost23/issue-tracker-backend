import { Request, RequestHandler, Response } from "express";
import { validate } from "../../utils/zodValidateRequest.js";
import { prisma } from "../../config/db.js";
import { z } from "zod";

// Zod schema to validate request
const getFileByFilenameSchema = z.object({
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
    filename: z
      .string({
        invalid_type_error: "Filename is not a string",
        required_error: "Filename is required",
      })
      .min(1, { message: "Filename cannot be empty" }),
  }),
});

/**
 @route GET /api/ticket/:ticketId/download/:filename
 @type RequestHandler
 */

export const getFileByFilenameValidator: RequestHandler = validate(
  getFileByFilenameSchema
);

export const getFileByFilename = async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;

      const downloadLink = await prisma.files.findUnique({
        where: {
          filename: filename,
        },
      });
      if (!downloadLink) {
        return res.status(404).send({ error: "No download link found" });
      }
      return res.status(200).send({
        data: {
            downloadLink
        },
        message: "Found file successfully",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        error: "Something went wrong while getting file",
      });
    }
};
