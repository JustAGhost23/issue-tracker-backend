import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import {
  getAllUsersValidator,
  getAllUsers,
} from "../controllers/user/getAllUsers.js";
import {
  editUserValidator,
  editUser,
} from "../controllers/user/editUser.js";
import {
  getUserByUsernameValidator,
  getUserByUsername,
} from "../controllers/user/getUserByUsername.js";
import { deleteUser } from "../controllers/user/deleteUser.js";
import {
  getUserProjects,
  getUserProjectsValidator,
} from "../controllers/user/getUserProjects.js";
import {
  getUserTickets,
  getUserTicketsValidator,
} from "../controllers/user/getUserTickets.js";
import {
  getUserComments,
  getUserCommentsValidator,
} from "../controllers/user/getUserComments.js";

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
  "/:username/edit",
  passportJWT,
  editUserValidator,
  editUser
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
 @route /api/user/:username/comments
 @desc Get user comments
 */
userRouter.get(
  "/:username/comments",
  passportJWT,
  getUserCommentsValidator,
  getUserComments
);

/**
 @route /api/user/:username/delete
 @desc Delete current user
 */
userRouter.post("/:username/delete", passportJWT, deleteUser);

export default userRouter;
