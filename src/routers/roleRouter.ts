import { Role } from "@prisma/client";
import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import { approveRoleChangeValidator, approveRoleChange } from "../controllers/role/approveRoleChange.js";
import { requestRoleChangeValidator, requestRoleChange } from "../controllers/role/requestRoleChange.js";
import { authorize } from "../middlewares/user.js";

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

export default roleRouter;