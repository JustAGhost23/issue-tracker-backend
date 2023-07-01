import { Router } from "express";
import {
  createProject,
  createProjectValidator,
} from "../controllers/project/createProject";
import passport from "../middlewares/passportAuth";

const passportJWT = passport.authenticate("jwt", { session: false });

const projectRouter: Router = Router();

/**
 @route /api/project/
 @desc Create new project
 */
projectRouter.post(
  "/register",
  passportJWT,
  createProjectValidator,
  createProject
);

export default projectRouter;
