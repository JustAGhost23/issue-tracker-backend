import { Router } from "express";
import authRouter from "./authRouter.js";
import userRouter from "./userRouter.js";
import projectRouter from "./projectRouter.js";
import ticketRouter from "./ticketRouter.js";
import commentRouter from "./commentRouter.js";
import { refreshUserToken } from "../middlewares/refresh.js";

const appRouter: Router = Router();

appRouter.use(refreshUserToken);

appRouter.use("/auth", authRouter);
appRouter.use("/user", userRouter);
appRouter.use("/project", projectRouter);
appRouter.use("/ticket", ticketRouter);
appRouter.use("/comment", commentRouter);

export default appRouter;
