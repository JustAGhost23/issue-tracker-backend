import { Router } from "express";
import { generateTokens } from "../middlewares/generateToken.js";
import passport from "../middlewares/passportAuth.js";
import { registerValidator, register } from "../controllers/auth/register.js";
import { loginValidator, login } from "../controllers/auth/login.js";
import { logout } from "../controllers/auth/logout.js";
import {
  verifyEmailValidator,
  verifyEmail,
} from "../controllers/auth/verifyEmail.js";
import {
  forgotPasswordValidator,
  forgotPassword,
} from "../controllers/auth/forgotPassword.js";
import {
  resetPassword,
  resetPasswordValidator,
} from "../controllers/auth/resetPassword.js";
import { refreshAccessToken } from "../controllers/auth/refreshAccessToken.js";

const passportJWT = passport.authenticate("jwt", { session: false });
const passportRefresh = passport.authenticate("refresh", { session: false });
const passportGoogle = passport.authenticate("google", {
  session: false,
});

const authRouter: Router = Router();

/**
 @route /api/auth/google
 @desc Login using Google Account
 */
authRouter.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  })
);
authRouter.get("/google/callback", passportGoogle, generateTokens);

/**
 @route /api/auth/register
 @desc Register using username/password
 */
authRouter.post("/register", registerValidator, register);

/**
 @route /api/auth/login
 @desc Login using username/password
 */
authRouter.post("/login", loginValidator, login);

/**
 @route /api/auth/logout
 @desc Logout
 */
authRouter.post("/logout", passportJWT, logout);

/**
 @route /api/auth/verify-email
 @desc Verify User Email
 */
authRouter.post("/verify-email", verifyEmailValidator, verifyEmail);

/**
 @route /api/auth/forgot
 @desc Forgot Password
 */
authRouter.post("/forgot", forgotPasswordValidator, forgotPassword);

/**
 @route /api/auth/reset-password
 @desc Reset Password Verification
 */
authRouter.post("/reset-password", resetPasswordValidator, resetPassword);

/**
 @route /api/auth/refresh
 @desc Refresh Access Token
 */
authRouter.post("/refresh", passportRefresh, refreshAccessToken);

export default authRouter;
