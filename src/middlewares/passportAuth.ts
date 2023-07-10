import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../config/db.js";
import { Provider, Role } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import {
  accessTokenExtractor,
  refreshTokenExtractor,
} from "../utils/tokenExtractor.js";
import crypto from "crypto";

const JwtAuthCallback = async (jwt_payload: JwtPayload, done: any) => {
  try {
    const user = await prisma.user.findUnique({
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
      jwtFromRequest: accessTokenExtractor,
      secretOrKey: process.env.TOKEN_SECRET,
    },
    JwtAuthCallback
  )
);

const RefreshAuthCallback = async (jwt_payload: JwtPayload, done: any) => {
  try {
    const user = await prisma.user.findUnique({
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
  "refresh",
  new JwtStrategy(
    {
      jwtFromRequest: refreshTokenExtractor,
      secretOrKey: process.env.REFRESH_TOKEN_SECRET,
    },
    RefreshAuthCallback
  )
);

const GoogleAuthCallback = async (
  accessToken: any,
  refreshToken: any,
  profile: any,
  done: any
) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        googleId: profile.id,
        provider: {
          has: Provider.GOOGLE,
        },
      },
    });
    if (user) {
      return done(null, user);
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: profile._json.email,
      },
    });
    if (existingUser) {
      existingUser.provider = [Provider.GOOGLE, Provider.LOCAL];
      existingUser.googleId = profile.id;

      const savedUser = await prisma.user.update({
        where: {
          email: profile._json.email,
        },
        data: existingUser,
      });
      return done(null, savedUser);
    }

    const username = profile.username;

    const foundUsername = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    if (foundUsername) {
      username.concat("#");
      username.concat(crypto.randomInt(0, 10000));
    }

    console.log("User does not exist");
    const newUser = await prisma.user.create({
      data: {
        email: profile._json.email,
        username: username,
        name: profile.displayName,
        provider: [Provider.GOOGLE],
        role: Role.EMPLOYEE,
        googleId: profile.id,
      },
    });
    return done(null, newUser);
  } catch (err) {
    return done(err, false);
  }
};

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
      proxy: true,
    },
    GoogleAuthCallback
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

export default passport;
