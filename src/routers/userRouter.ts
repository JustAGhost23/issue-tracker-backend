import { Router } from "express";
import { getAllUsersValidator, getAllUsers } from "../controllers/user/getAllUsers";
import {
  editCurrentUserValidator,
  editCurrentUser,
} from "../controllers/user/editCurrentUser";
import {
  getUserByUsernameValidator,
  getUserByUsername,
} from "../controllers/user/getUserByUsername";
import { deleteCurrentUser } from "../controllers/user/deleteCurrentUser";
import passport from "../middlewares/passportAuth";

const passportJWT = passport.authenticate("jwt", { session: false });

const userRouter: Router = Router();

/**
 @route /api/user/
 @desc Get all users
 */
userRouter.get('/', passportJWT, getAllUsersValidator, getAllUsers);

/**
 @route /api/user/edit
 @desc Edit current user details
 */
userRouter.post('/edit', passportJWT, editCurrentUserValidator, editCurrentUser);

/**
 @route /api/user/:username
 @desc Get user by username
 */
userRouter.get('/:username', passportJWT, getUserByUsernameValidator, getUserByUsername);

/**
 @route /api/user/delete
 @desc Delete current user
 */
userRouter.post('/delete', passportJWT, deleteCurrentUser);

export default userRouter;
