import { Token } from "../utils/enums.js";
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { redisClient } from "../config/db.js";
import { hashPassword } from "../utils/password.js";
import crypto from "crypto";
import { IssueActivity, Project, Requests, Ticket, User } from "@prisma/client";

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

export const sendForgotPasswordEmail = async (user: User) => {
  // Create new password reset token
  const token = crypto.randomBytes(16).toString("hex");
  const newToken = await redisClient.set(
    token,
    JSON.stringify({
      email: user.email,
      type: Token.PASSWORD,
    }),
    {
      EX: 60 * 60,
    }
  );
  if (!newToken) {
    throw Error("Something went wrong while creating token");
  }

  // Create and send password reset email to the user
  // Edit this link to link it to the frontend
  const verificationLink = `http://localhost:3000/api/auth/reset-password?token=${token}`;

  const msg = {
    from: "issuetracker@gmail.com",
    to: user.email,
    subject: "Password Reset",
    html: `Please click on this <a href="${verificationLink}">link</a> to reset your password. Link is valid for 1 hour.`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending password recovery email");
    });
};

export const sendApprovedRoleChangeMail = async (
  request: Requests,
  emailId: string
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailId,
    subject: "Request for role change approved",
    html: `Your request for your role to be changed to ${request.role} has been approved`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending approved request email");
    });
};

export const sendRejectedRoleChangeMail = async (
  request: Requests,
  emailId: string
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailId,
    subject: "Request for role change rejected",
    html: `Your request for your role to be changed to ${request.role} has been rejected`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending rejected request email");
    });
};

export const sendProjectDeletedMail = async (
  user: User,
  projectName: string,
  emailIds: string[]
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailIds,
    subject: `Project ${projectName}`,
    html: `Project ${projectName} was deleted by ${user.role} ${user.username}.`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending rejected request email");
    });
};

export const sendProjectAddUserMail = async (
  user: User,
  project: Project,
  emailId: string
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailId,
    subject: `Project ${project.name}`,
    html: `You were added to Project ${project.name} by ${user.role} ${user.username}.`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending add user email");
    });
};

export const sendProjectRemoveUserMail = async (
  user: User,
  project: Project,
  emailId: string
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailId,
    subject: `Project ${project.name}`,
    html: `You were removed from Project ${project.name} by ${user.role} ${user.username}.`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending remove user email");
    });
};

export const sendTransferOwnershipMail = async (
  user: User,
  project: Project,
  emailId: string
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailId,
    subject: `Project ${project.name}`,
    html: `You were made the new owner of Project ${project.name} by ${user.role} ${user.username}.`,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error(
        "Something went wrong while sending transfer ownership email"
      );
    });
};

export const sendTicketCreatedEmail = async (
  issueActivity: IssueActivity,
  project: Project,
  emailIds: string[]
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailIds,
    subject: `Project ${project.name}`,
    html: issueActivity.text,
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

export const sendTicketAssignedEmail = async (
  issueActivity: IssueActivity,
  ticket: Ticket,
  emailIds: string[]
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailIds,
    subject: `Ticket ${ticket.name}`,
    html: issueActivity.text,
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

export const sendTicketUnassignedEmail = async (
  issueActivity: IssueActivity,
  ticket: Ticket,
  emailId: string
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailId,
    subject: `Ticket ${ticket.name}`,
    html: issueActivity.text,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending ticket unassigned email");
    });
};

export const sendTicketEditedEmail = async (
  issueActivity: IssueActivity,
  ticket: Ticket,
  emailIds: string[]
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailIds,
    subject: `Ticket ${ticket.name}`,
    html: issueActivity.text,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending ticket unassigned email");
    });
};

export const sendCommentCreatedEmail = async (
  issueActivity: IssueActivity,
  ticket: Ticket,
  emailIds: string[]
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailIds,
    subject: `Ticket ${ticket.name}`,
    html: issueActivity.text,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending comment created email");
    });
};

export const sendCommentEditedEmail = async (
  issueActivity: IssueActivity,
  ticket: Ticket,
  emailIds: string[]
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailIds,
    subject: `Ticket ${ticket.name}`,
    html: issueActivity.text,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending ticket unassigned email");
    });
};

export const sendCommentDeletedEmail = async (
  issueActivity: IssueActivity,
  ticket: Ticket,
  emailIds: string[]
) => {
  const msg = {
    from: "issuetracker@gmail.com",
    to: emailIds,
    subject: `Ticket ${ticket.name}`,
    html: issueActivity.text,
  };

  transporter
    .sendMail(msg)
    .then(() => {
      console.log("Email sent successfully");
      return true;
    })
    .catch((err) => {
      console.log(err);
      throw Error("Something went wrong while sending ticket unassigned email");
    });
};
