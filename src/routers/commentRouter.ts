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
import {
  editComment,
  editCommentValidator,
} from "../controllers/comment/editComment.js";
import {
  getCommentById,
  getCommentByIdValidator,
} from "../controllers/comment/getCommentById.js";

const passportJWT = passport.authenticate("jwt", { session: false });

const commentRouter: Router = Router();

/**
 @route /api/comment/
 @desc Create new comment
 */
commentRouter.post("/", passportJWT, createCommentValidator, createComment);

/**
 @route /api/comment/:commentId/edit
 @desc Edit comment
 */
commentRouter.post(
  "/:commentId/edit",
  passportJWT,
  editCommentValidator,
  editComment
);

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

/**
 @route /api/comment/:commentId
 @desc Get comment by commentId
 */
commentRouter.get(
  "/:commentId",
  passportJWT,
  getCommentByIdValidator,
  getCommentById
);

export default commentRouter;
