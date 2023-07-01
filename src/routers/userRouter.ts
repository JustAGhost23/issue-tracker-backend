import { Router } from "express";
import passport from "passport";

const passportJWT = passport.authenticate("jwt", { session: false });

const userRouter: Router = Router();

export default userRouter;
