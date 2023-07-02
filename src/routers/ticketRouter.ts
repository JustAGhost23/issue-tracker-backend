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

const passportJWT = passport.authenticate("jwt", { session: false });

const ticketRouter: Router = Router();

/**
 * @route /api/ticket/
 * @desc  Create new ticket
 */
ticketRouter.post("/", passportJWT, createTicketValidator, createTicket);

/**
 * @route /api/ticket/:ticketId/edit
 * @desc  Edit ticket
 */
ticketRouter.post(
  "/:ticketId/edit",
  passportJWT,
  editTicketValidator,
  editTicket
);

/**
 * @route /api/ticket/:ticketId/assign
 * @desc Assign ticket
 */
ticketRouter.post(
  "/:ticketId/assign",
  passportJWT,
  assignTicketValidator,
  assignTicket
);

export default ticketRouter;
