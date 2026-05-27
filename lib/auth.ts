import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { signinSchema } from "@/lib/validations";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signinSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        if (!user.isEmailVerified) {
          throw new Error("Please verify your email first");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          fullName: user.fullName,
          isEmailVerified: user.isEmailVerified,
          isProfileComplete: user.isProfileComplete,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.fullName = user.fullName;
        token.isEmailVerified = user.isEmailVerified;
        token.isProfileComplete = user.isProfileComplete;
      }

      if (trigger === "update" && session?.isProfileComplete !== undefined) {
        token.isProfileComplete = session.isProfileComplete as boolean;
      }

      if (token.id && trigger !== "update") {
        const [dbUser] = await db
          .select({
            isProfileComplete: users.isProfileComplete,
            role: users.role,
            fullName: users.fullName,
          })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);

        if (dbUser) {
          token.isProfileComplete = dbUser.isProfileComplete;
          token.role = dbUser.role;
          token.fullName = dbUser.fullName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role;
      session.user.fullName = token.fullName;
      session.user.isEmailVerified = token.isEmailVerified;
      session.user.isProfileComplete = token.isProfileComplete;
      return session;
    },
  },
};
