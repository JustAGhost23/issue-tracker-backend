import { Router } from "express";
import {
  createProject,
  createProjectValidator,
} from "../controllers/project/createProject.js";
import passport from "../middlewares/passportAuth.js";
import {
  deleteProject,
  deleteProjectValidator,
} from "../controllers/project/deleteProject.js";
import {
  getAllProjects,
  getAllProjectsValidator,
} from "../controllers/project/getAllProjects.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const projectRouter: Router = Router();


/**
 @route /api/project/
 @desc  Get all projects
 */
projectRouter.get("/", passportJWT, getAllProjectsValidator, getAllProjects);

/**
 @route /api/project/
 @desc  Create new project
 */
projectRouter.post("/", passportJWT, createProjectValidator, createProject);

/**
 @route /api/project/:username/:name/delete
 @desc  Delete project
 */
projectRouter.post(
  "/:username/:name/delete",
  passportJWT,
  deleteProjectValidator,
  deleteProject
);

export default projectRouter;
