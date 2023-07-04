import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import {
  getAllUsersValidator,
  getAllUsers,
} from "../controllers/user/getAllUsers.js";
import {
  editCurrentUserValidator,
  editCurrentUser,
} from "../controllers/user/editCurrentUser.js";
import {
  getUserByUsernameValidator,
  getUserByUsername,
} from "../controllers/user/getUserByUsername.js";
import { deleteCurrentUser } from "../controllers/user/deleteCurrentUser.js";
import {
  getUserProjects,
  getUserProjectsValidator,
} from "../controllers/user/getUserProjects.js";
import {
  getUserTickets,
  getUserTicketsValidator,
} from "../controllers/user/getUserTickets.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const userRouter: Router = Router();

/**
 @route /api/user/
 @desc Get all users
 */
userRouter.get("/", passportJWT, getAllUsersValidator, getAllUsers);

/**
 @route /api/user/edit
 @desc Edit current user details
 */
userRouter.post(
  "/edit",
  passportJWT,
  editCurrentUserValidator,
  editCurrentUser
);

/**
 @route /api/user/:username
 @desc Get user by username
 */
userRouter.get(
  "/:username",
  passportJWT,
  getUserByUsernameValidator,
  getUserByUsername
);

/**
 @route /api/user/:username/projects
 @desc Get user projects
 */
userRouter.get(
  "/:username/projects",
  passportJWT,
  getUserProjectsValidator,
  getUserProjects
);

/**
 @route /api/user/:username/tickets
 @desc Get user tickets
 */
userRouter.get(
  "/:username/tickets",
  passportJWT,
  getUserTicketsValidator,
  getUserTickets
);

/**
 @route /api/user/delete
 @desc Delete current user
 */
userRouter.post("/delete", passportJWT, deleteCurrentUser);

export default userRouter;
