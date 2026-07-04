import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { isAuthConfigured, isGithubIdentityAllowed } from "@/lib/env";

const providers =
  isAuthConfigured() && process.env.GITHUB_ID && process.env.GITHUB_SECRET
    ? [
        GitHub({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "database" },
  trustHost: true,
  callbacks: {
    async signIn({ profile, user }) {
      const login =
        profile && "login" in profile && typeof profile.login === "string"
          ? profile.login
          : null;
      return isGithubIdentityAllowed({
        login,
        email: user.email,
      });
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
