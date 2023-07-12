import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import {
  createTicket,
  createTicketValidator,
} from "../controllers/ticket/createTicket.js";
import {
  editTicket,
  editTicketValidator,
} from "../controllers/ticket/editTicket.js";
import {
  assignTicket,
  assignTicketValidator,
} from "../controllers/ticket/assignTicket.js";
import {
  unassignTicket,
  unassignTicketValidator,
} from "../controllers/ticket/unassignTicket.js";
import {
  getTicketById,
  getTicketByIdValidator,
} from "../controllers/ticket/getTicketById.js";
import {
  getTicketComments,
  getTicketCommentsValidator,
} from "../controllers/ticket/getTicketComments.js";
import { upload } from "../config/aws.js";
import {
  uploadFile,
  uploadFileValidator,
} from "../controllers/ticket/uploadFile.js";
import {
  getFileByFilename,
  getFileByFilenameValidator,
} from "../controllers/ticket/getFileByFilename.js";
import {
  deleteFile,
  deleteFileValidator,
} from "../controllers/ticket/deleteFile.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const ticketRouter: Router = Router();

/**
 @route /api/ticket/
 @desc Create new ticket
 */
ticketRouter.post("/", passportJWT, createTicketValidator, createTicket);

/**
 @route /api/ticket/:ticketId/edit
 @desc Edit ticket
 */
ticketRouter.post(
  "/:ticketId/edit",
  passportJWT,
  editTicketValidator,
  editTicket
);

/**
 @route /api/ticket/:ticketId/assign
 @desc Assign ticket
 */
ticketRouter.post(
  "/:ticketId/assign",
  passportJWT,
  assignTicketValidator,
  assignTicket
);

/**
 @route /api/ticket/:ticketId/unassign
 @desc Unassign ticket
 */
ticketRouter.post(
  "/:ticketId/unassign",
  passportJWT,
  unassignTicketValidator,
  unassignTicket
);

/**
 @route /api/ticket/:ticketId
 @desc Get ticket by id
 */
ticketRouter.get(
  "/:ticketId",
  passportJWT,
  getTicketByIdValidator,
  getTicketById
);

/**
 @route /api/ticket/:ticketId/comments
 @desc Get ticket comments
 */
ticketRouter.get(
  "/:ticketId/comments",
  passportJWT,
  getTicketCommentsValidator,
  getTicketComments
);

/**
 @route /api/ticket/:ticketId/upload
 @desc Upload file
 */
ticketRouter.post(
  "/:ticketId/upload",
  passportJWT,
  upload.single("file"),
  uploadFileValidator,
  uploadFile
);

/**
 @route /api/ticket/:ticketId/download/:filename
 @desc Download File
 */
ticketRouter.get(
  "/:ticketId/download/:filename",
  passportJWT,
  getFileByFilenameValidator,
  getFileByFilename
);

/**
 @route /api/ticket/:ticketId/delete/:filename
 @desc Delete File
 */
ticketRouter.post(
  "/:ticketId/delete/:filename",
  passportJWT,
  deleteFileValidator,
  deleteFile
);

export default ticketRouter;
