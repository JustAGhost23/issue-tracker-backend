import express, { json, urlencoded, Express } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

const app: Express = express();

app.use(cookieParser());
app.use(json());
app.use(urlencoded({ extended: false }));

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
