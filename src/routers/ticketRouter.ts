import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import {
  createTicket,
  createTicketValidator,
} from "../controllers/ticket/createTicket.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const ticketRouter: Router = Router();

/**
 * @route /api/ticket/
 * @desc  Create new ticket
 */
ticketRouter.post("/", passportJWT, createTicketValidator, createTicket);

export default ticketRouter;
