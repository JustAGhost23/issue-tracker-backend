import { Role } from "@prisma/client";
import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import {
  approveRoleChangeValidator,
  approveRoleChange,
} from "../controllers/role/approveRoleChange.js";
import {
  requestRoleChangeValidator,
  requestRoleChange,
} from "../controllers/role/requestRoleChange.js";
import { authorize } from "../middlewares/user.js";
import {
  rejectRoleChange,
  rejectRoleChangeValidator,
} from "../controllers/role/rejectRoleChange.js";
import {
  deleteRequest,
  deleteRequestValidator,
} from "../controllers/role/deleteRequest.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const roleRouter: Router = Router();

/**
 @route /api/role/request
 @desc Request for role change
 */
roleRouter.post(
  "/request",
  passportJWT,
  authorize(Role.EMPLOYEE, Role.PROJECT_OWNER),
  requestRoleChangeValidator,
  requestRoleChange
);

/**
 @route /api/role/request/approve
 @desc Approve role change
 */
roleRouter.post(
  "/request/approve",
  passportJWT,
  authorize(Role.ADMIN),
  approveRoleChangeValidator,
  approveRoleChange
);

/**
 @route /api/role/request/reject
 @desc Reject role change
 */
roleRouter.post(
  "/request/reject",
  passportJWT,
  authorize(Role.ADMIN),
  rejectRoleChangeValidator,
  rejectRoleChange
);

/**
 @route /api/role/request/delete
 @desc Delete request
 */
roleRouter.post(
  "/request/delete",
  passportJWT,
  authorize(Role.EMPLOYEE, Role.PROJECT_OWNER),
  deleteRequestValidator,
  deleteRequest
);

export default roleRouter;
