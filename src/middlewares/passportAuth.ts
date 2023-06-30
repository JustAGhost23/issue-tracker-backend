import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";
import { prisma } from "../config/db.js";
import { cookieExtractor } from "../utils/cookieExtractor.js";
import { JwtPayload } from "jsonwebtoken";

const JwtAuthCallback = async (jwt_payload: JwtPayload, done: any) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: parseInt(jwt_payload.sub ?? "0") },
    });
    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (err) {
    return done(err, false);
  }
};

passport.use(
  "jwt",
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.TOKEN_SECRET,
    },
    JwtAuthCallback
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

export default passport;
