import { Router } from "express";
import authRouter from "./authRouter.js";
import userRouter from "./userRouter.js";
import projectRouter from "./projectRouter.js";
import ticketRouter from "./ticketRouter.js";

const appRouter: Router = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/user", userRouter);
appRouter.use("/project", projectRouter);
appRouter.use("/ticket", ticketRouter);

export default appRouter;
