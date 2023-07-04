import { Router } from "express";
import passport from "../middlewares/passportAuth.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const commentRouter: Router = Router();

export default commentRouter;