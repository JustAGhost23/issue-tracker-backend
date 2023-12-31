import { Router } from "express";
import authRouter from "./authRouter.js";
import userRouter from "./userRouter.js";
import roleRouter from "./roleRouter.js";
import projectRouter from "./projectRouter.js";
import ticketRouter from "./ticketRouter.js";
import commentRouter from "./commentRouter.js";

const appRouter: Router = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/user", userRouter);
appRouter.use("/role", roleRouter);
appRouter.use("/project", projectRouter);
appRouter.use("/ticket", ticketRouter);
appRouter.use("/comment", commentRouter);

export default appRouter;
