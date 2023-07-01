import { Router } from "express";
import { registerValidator, register } from "../controllers/auth/register";
import { loginValidator, login } from "../controllers/auth/login";
import { logout } from "../controllers/auth/logout";
import generateUserToken from "../middlewares/generateToken";
import passport from "../middlewares/passportAuth";

const passportJWT = passport.authenticate("jwt", { session: false });
const passportGoogle = passport.authenticate("google", {
  session: false,
});

const authRouter: Router = Router();

/**
 @route /api/auth/google
 @desc Login using Google Account
 */
authRouter.post(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  })
);
authRouter.get("/google/callback", passportGoogle, generateUserToken);

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

/**
 @route /api/auth/logout
 @desc Logout
 */
authRouter.post('/logout', passportJWT, logout);

export default authRouter;
