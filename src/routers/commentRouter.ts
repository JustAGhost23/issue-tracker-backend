import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import {
  createComment,
  createCommentValidator,
} from "../controllers/comment/createComment.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const commentRouter: Router = Router();

/**
 @route /api/comment/
 @desc Create new comment
 */
commentRouter.post("/", passportJWT, createCommentValidator, createComment);

export default commentRouter;
