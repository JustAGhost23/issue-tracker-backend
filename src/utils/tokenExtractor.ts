import { Request } from "express";

export function accessTokenExtractor(req: Request) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["jwt"];
  }
  return token;
}

export function refreshTokenExtractor(req: Request) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["refresh"];
  }
  return token;
}
