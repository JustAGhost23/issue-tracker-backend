import { Token } from "../utils/enums.js";
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { redisClient } from "../config/db.js";
import { hashPassword } from "../utils/password.js";
import crypto from "crypto";
import { Project, Ticket } from "@prisma/client";

const config = {
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_MAIL_USER!,
    pass: process.env.GOOGLE_MAIL_PASSWORD!,
  },
};
const transporter = nodemailer.createTransport(config);

export const sendVerificationEmail = async (req: Request, res: Response) => {
  // Hash password
  const hashed = await hashPassword(req.body.password);

  // Create new email verification token
  const token = crypto.randomBytes(16).toString("hex");
  const newToken = await redisClient.set(
    token,
    JSON.stringify({
      email: req.body.email,
      username: req.body.username,
      name: req.body.name,
      password: hashed,
      type: Token.EMAIL,
    }),
    {
      EX: 60 * 60,
    }
  );
  if (!newToken) {
    return res.status(500).send({
      error: "Something went wrong while creating token",
    });
  }
  const verificationLink = `http://${req.headers.host}/api/auth/verify-email?token=${token}`;

  const msg = {
    from: "issuetracker@gmail.com",
    to: req.body.email,
    subject: "Email Verification",
    html: `Please click on this <a href="${verificationLink}">link</a> within the next 1 hour to verify your account on issue-tracker.`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send({
        error: "Something went wrong while sending verification email",
      });
    });
};

export const sendForgotPasswordEmail = async (req: Request, res: Response) => {
  // Create new password reset token
  const token = crypto.randomBytes(16).toString("hex");
  const newToken = await redisClient.set(
    token,
    JSON.stringify({
      email: req.body.email,
      type: Token.PASSWORD,
    }),
    {
      EX: 60 * 60,
    }
  );
  if (!newToken) {
    return res.status(500).send({
      error: "Something went wrong while creating token",
    });
  }

  // Create and send password reset email to the user
  // Edit this link to link it to the frontend
  const verificationLink = `http://${req.headers.host}/api/auth/reset-password?token=${token}`;

  const msg = {
    from: "issuetracker@gmail.com",
    to: req.body.email,
    subject: "Password Reset",
    html: `Please click on this <a href="${verificationLink}">link</a> to reset your password. Link is valid for 7 days`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send({
        error: "Something went wrong while sending password recovery email",
      });
    });
};

export const sendTicketAssignedEmail = async (project: Project, ticket: Ticket, assignedEmailIds: string[]) => {
  const frontendLink = `http://localhost:3000`;

  const msg = {
    from: "issuetracker@gmail.com",
    to: assignedEmailIds,
    subject: "Ticket Assigned",
    html: `You have been assigned the ticket ${ticket.name} in the project ${project.name}, please click on this <a href="${frontendLink}">link</a> to go to the website`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending ticked assigned email");
    });
};

export const sendTicketUnassignedEmail = async (project: Project, ticket: Ticket, assignedEmailId: string) => {
    const msg = {
        from: "issuetracker@gmail.com",
        to: assignedEmailId,
        subject: "Ticket Unassigned",
        html: `You have been unassigned from the ticket ${ticket.name} from the project ${project.name}.`,
    };

    transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending ticket unassigned email");
    });
};
