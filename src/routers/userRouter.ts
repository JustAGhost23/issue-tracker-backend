import { Router } from "express";
import { getAllUsersValidator, getAllUsers } from "../controllers/user/getAllUsers";
import passport from "../middlewares/passportAuth";

const passportJWT = passport.authenticate("jwt", { session: false });

const userRouter: Router = Router();

/**
 @route /api/user/
 @desc Get all users
 */
userRouter.get('/', passportJWT, getAllUsersValidator, getAllUsers);

export default userRouter;
