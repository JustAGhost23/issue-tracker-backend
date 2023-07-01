import { Router } from "express";
import { registerValidator, register } from "../controllers/auth/register";

const authRouter: Router = Router();

/**
 @route /api/auth/register
 @desc Register using username/password
 */
authRouter.post('/register', registerValidator, register);

export default authRouter;
