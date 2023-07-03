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
  getAllTicketsOfUser,
  getAllTicketsOfUserValidator,
} from "../controllers/ticket/getAllTicketsOfUser.js";
import {
  getAllTicketsOfProject,
  getAllTicketsOfProjectValidator,
} from "../controllers/ticket/getAllTicketsOfProject.js";

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

/**
 * @route /api/ticket/:ticketId/unassign
 * @desc  Unassign ticket
 */
ticketRouter.post(
  "/:ticketId/unassign",
  passportJWT,
  unassignTicketValidator,
  unassignTicket
);

/**
 @route /api/ticket/:ticketId
 @desc  Get ticket by id
 */
ticketRouter.get(
  "/:ticketId",
  passportJWT,
  getTicketByIdValidator,
  getTicketById
);

/**
 (Need to change this route to something more readable)
 @route /api/ticket/user/:username/assigned
 @desc  Get all assigned tickets of a user
 */
ticketRouter.get(
  "/user/:username/assigned",
  passportJWT,
  getAllTicketsOfUserValidator,
  getAllTicketsOfUser
);

/**
 @route /api/ticket/:username/:name
 @desc  Get all tickets of a project
 */
ticketRouter.get(
  "/:username/:name",
  passportJWT,
  getAllTicketsOfProjectValidator,
  getAllTicketsOfProject
);

export default ticketRouter;
