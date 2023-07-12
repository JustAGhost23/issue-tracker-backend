import { Request, RequestHandler, Response } from "express";
import { validate } from "../../utils/zodValidateRequest.js";
import { z } from "zod";
import { s3 } from "../../config/aws.js";

// Zod schema to validate request
const deleteFileSchema = z.object({
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
 @route POST /api/ticket/:ticketId/delete/:filename
 @type RequestHandler
 */

export const deleteFileValidator: RequestHandler = validate(deleteFileSchema);

export const deleteFile = async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;

      const deletedObject = await s3
        .deleteObject({
          Key: filename,
          Bucket: process.env.S3_BUCKET_NAME!,
        })
        .promise()
        .then(
          (data) => {
            return res
              .status(200)
              .send({ message: "File deleted successfully" });
          },
          (error) => {
            return res.status(400).send({ error: error });
          }
        );
    } catch (err) {
      console.log(err);
      res.status(500).send({
        error: "Something went wrong while deleting file",
      });
    }
};
