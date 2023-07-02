import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import {
  createProject,
  createProjectValidator,
} from "../controllers/project/createProject.js";
import {
  deleteProject,
  deleteProjectValidator,
} from "../controllers/project/deleteProject.js";
import {
  getAllProjects,
  getAllProjectsValidator,
} from "../controllers/project/getAllProjects.js";
import {
  getProjectByName,
  getProjectByNameValidator,
} from "../controllers/project/getProjectByName.js";
import { addUser, addUserValidator } from "../controllers/project/addUser.js";
import {
  removeUser,
  removeUserValidator,
} from "../controllers/project/removeUser.js";
import {
  leaveProject,
  leaveProjectValidator,
} from "../controllers/project/leaveProject.js";
import {
  transferOwnership,
  transferOwnershipValidator,
} from "../controllers/project/transferOwnership.js";
import {
  getAllProjectsOfUser,
  getAllProjectsOfUserValidator,
} from "../controllers/project/getAllProjectsOfUser.js";

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
 @route /api/project/:username/:name
 @desc  Get project by name
 */
projectRouter.get(
  "/:username/:name",
  passportJWT,
  getProjectByNameValidator,
  getProjectByName
);

/**
 @route /api/project/:username
 @desc  Get all projects of a user
 */
projectRouter.get(
  "/:username",
  passportJWT,
  getAllProjectsOfUserValidator,
  getAllProjectsOfUser
);

/**
 * @route /api/project/:username/:name/transfer
 * @desc  Transfer ownership of project
 */
projectRouter.post(
  "/:username/:name/transfer",
  passportJWT,
  transferOwnershipValidator,
  transferOwnership
);

/**
 * @route /api/project/:username/:name/add-user
 * @desc Add user to project
 */
projectRouter.post(
  "/:username/:name/add-user",
  passportJWT,
  addUserValidator,
  addUser
);

/**
 * @route /api/projects/:username/:name/remove-user
 * @desc  Remove user from project
 */

projectRouter.post(
  "/:username/:name/remove-user",
  passportJWT,
  removeUserValidator,
  removeUser
);

/**
 * @route /api/project/:username/:name/leave
 * @desc Leave a project
 */
projectRouter.post(
  "/:username/:name/leave",
  passportJWT,
  leaveProjectValidator,
  leaveProject
);

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
