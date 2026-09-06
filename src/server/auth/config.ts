import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuditAction, type Locale, type PlatformRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { prisma } from "@/server/db";
import { auditService } from "@/server/services/audit.service";
import { platformOrgService } from "@/server/services/platform-org.service";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/el/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash || user.deletedAt) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          locale: user.locale,
          platformRole: user.platformRole,
        };
      },
    }),
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;

        if (user.locale && user.platformRole) {
          token.locale = user.locale;
          token.platformRole = user.platformRole;
        } else if (user.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { locale: true, platformRole: true },
          });

          if (dbUser) {
            token.locale = dbUser.locale;
            token.platformRole = dbUser.platformRole;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.locale = token.locale as Locale;
      session.user.platformRole = token.platformRole as PlatformRole;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) {
        return;
      }

      await platformOrgService.ensurePlatformMembership(user.id);
    },
    async signIn({ user }) {
      if (!user.id) {
        return;
      }

      await auditService.logAudit({
        userId: user.id,
        action: AuditAction.USER_LOGIN,
        entity: "User",
        entityId: user.id,
      });
    },
  },
} satisfies NextAuthConfig;
