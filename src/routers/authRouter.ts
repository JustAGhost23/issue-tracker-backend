import { Router } from "express";
import { registerValidator, register } from "../controllers/auth/register";
import { loginValidator, login } from "../controllers/auth/login";

const authRouter: Router = Router();

/**
 @route /api/auth/register
 @desc Register using username/password
 */
authRouter.post('/register', registerValidator, register);

/**
 @route /api/auth/login
 @desc Login using username/password
 */
authRouter.post('/login', loginValidator, login);

export default authRouter;
