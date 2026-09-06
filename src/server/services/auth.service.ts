import { AuditAction, Locale, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import { prisma } from "@/server/db";
import { getMessagingProvider } from "@/server/providers/messaging";

import { auditService } from "./audit.service";
import { platformOrgService } from "./platform-org.service";

const BCRYPT_ROUNDS = 12;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  locale?: Locale;
}

export class AuthServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "AuthServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const authService = {
  async registerUser(
    input: RegisterUserInput,
    ipAddress?: string,
  ): Promise<{ userId: string }> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const locale = input.locale ?? Locale.el;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new AuthServiceError("Email is already registered", 409, "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const verificationToken = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          locale,
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: created.id,
          token: verificationToken,
          expiresAt,
        },
      });

      return created;
    });

    await platformOrgService.ensurePlatformMembership(user.id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${verificationToken}`;

    const messaging = getMessagingProvider("EMAIL");
    await messaging.send({
      to: email,
      subject: "Verify your Eventos account",
      html: `<p>Hi ${name},</p><p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`,
      text: `Hi ${name}, verify your email: ${verifyUrl}`,
    });

    await auditService.logAudit({
      userId: user.id,
      action: AuditAction.USER_REGISTER,
      entity: "User",
      entityId: user.id,
      metadata: { email },
      ipAddress,
    });

    return { userId: user.id };
  },

  async verifyEmail(token: string): Promise<{ userId: string }> {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.usedAt) {
      throw new AuthServiceError("Invalid verification token", 400, "INVALID_TOKEN");
    }

    if (record.expiresAt < new Date()) {
      throw new AuthServiceError("Verification token has expired", 410, "TOKEN_EXPIRED");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { userId: record.userId };
  },

  async requestPasswordReset(email: string): Promise<{ sent: boolean }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.deletedAt) {
      return { sent: true };
    }

    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/el/reset-password?token=${token}`;

    const messaging = getMessagingProvider("EMAIL");
    await messaging.send({
      to: normalizedEmail,
      subject: "Reset your Eventos password",
      html: `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>. This link expires in 1 hour.</p>`,
      text: `Reset your password: ${resetUrl}`,
    });

    return { sent: true };
  },

  async resetPassword(token: string, password: string): Promise<{ userId: string }> {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.usedAt) {
      throw new AuthServiceError("Invalid reset token", 400, "INVALID_TOKEN");
    }

    if (record.expiresAt < new Date()) {
      throw new AuthServiceError("Reset token has expired", 410, "TOKEN_EXPIRED");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { userId: record.userId };
  },
};
