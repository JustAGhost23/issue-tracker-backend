import express, { json, urlencoded, Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import passport from "./middlewares/passportAuth.js";
import appRouter from "./routers/index.js";
import dotenv from "dotenv";
dotenv.config();

const app: Express = express();

app.use(cookieParser());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors(corsOptions));

app.use(passport.initialize())

app.use("/api", appRouter);

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
