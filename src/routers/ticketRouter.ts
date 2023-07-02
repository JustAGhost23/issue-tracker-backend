import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import {
  createTicket,
  createTicketValidator,
} from "../controllers/ticket/createTicket.js";
import { editTicket, editTicketValidator } from "../controllers/ticket/editTicket.js";

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
ticketRouter.post("/:ticketId/edit", passportJWT, editTicketValidator, editTicket);

export default ticketRouter;
