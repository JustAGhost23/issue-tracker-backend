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
  getProjectTickets,
  getProjectTicketsValidator,
} from "../controllers/project/getProjectTickets.js";
import { authorize } from "../middlewares/user.js";
import { Role } from "@prisma/client";
import {
  editProject,
  editProjectValidator,
} from "../controllers/project/editProject.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const projectRouter: Router = Router();

/**
 @route /api/project/
 @desc Get all projects
 */
projectRouter.get("/", passportJWT, getAllProjectsValidator, getAllProjects);

/**
 @route /api/project/
 @desc Create new project
 */
projectRouter.post(
  "/",
  passportJWT,
  authorize(Role.ADMIN, Role.PROJECT_OWNER),
  createProjectValidator,
  createProject
);

/**
 @route /api/project/:username/:name
 @desc Get project by name
 */
projectRouter.get(
  "/:username/:name",
  passportJWT,
  getProjectByNameValidator,
  getProjectByName
);

/**
 @route /api/project/:username/:name/tickets
 @desc Get project tickets
 */
projectRouter.get(
  "/:username/:name/tickets",
  passportJWT,
  getProjectTicketsValidator,
  getProjectTickets
);

/**
 * @route /api/project/:username/:name/transfer
 * @desc Transfer ownership of project
 */
projectRouter.post(
  "/:username/:name/transfer",
  passportJWT,
  authorize(Role.ADMIN, Role.PROJECT_OWNER),
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
  authorize(Role.ADMIN, Role.PROJECT_OWNER),
  addUserValidator,
  addUser
);

/**
 * @route /api/projects/:username/:name/remove-user
 * @desc Remove user from project
 */

projectRouter.post(
  "/:username/:name/remove-user",
  passportJWT,
  authorize(Role.ADMIN, Role.PROJECT_OWNER),
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
 @route /api/project/:username/:name/edit
 @desc Edit project
 */
projectRouter.post(
  "/:username/:name/edit",
  passportJWT,
  authorize(Role.ADMIN, Role.PROJECT_OWNER),
  editProjectValidator,
  editProject
);

/**
 @route /api/project/:username/:name/delete
 @desc Delete project
 */
projectRouter.post(
  "/:username/:name/delete",
  passportJWT,
  authorize(Role.ADMIN, Role.PROJECT_OWNER),
  deleteProjectValidator,
  deleteProject
);

export default projectRouter;
