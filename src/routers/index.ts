import { Router } from "express";
import authRouter from "./authRouter";
import userRouter from "./userRouter";
import projectRouter from "./projectRouter";
import ticketRouter from "./ticketRouter";

const appRouter: Router = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/user", userRouter);
appRouter.use("/project", projectRouter);
appRouter.use("/ticket", ticketRouter);

export default appRouter;
