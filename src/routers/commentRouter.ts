import { Router } from "express";
import passport from "../middlewares/passportAuth.js";
import {
  createComment,
  createCommentValidator,
} from "../controllers/comment/createComment.js";
import {
  deleteComment,
  deleteCommentValidator,
} from "../controllers/comment/deleteComment.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const commentRouter: Router = Router();

/**
 @route /api/comment/
 @desc Create new comment
 */
commentRouter.post("/", passportJWT, createCommentValidator, createComment);

/**
 @route /api/comment/:commentId/delete
 @desc Delete comment
 */
commentRouter.post(
  "/:commentId/delete",
  passportJWT,
  deleteCommentValidator,
  deleteComment
);

export default commentRouter;
