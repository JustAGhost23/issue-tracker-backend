import express, { json, urlencoded, Express } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

const app: Express = express();

app.use(cookieParser());
app.use(json());
app.use(urlencoded({ extended: false }));

app.listen(3000, () => {
  console.log(`Listening on port 3000`);
});
