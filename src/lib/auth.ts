import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias de persistência
  },
  secret: process.env.NEXTAUTH_SECRET || "temp-secret-for-build-only",
  pages: {
    signIn: "/entrar",
    signOut: "/entrar",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.pedeue.com' : 'localhost',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("DEBUG - Authorize starting for:", credentials?.email);
          if (!credentials?.email || !credentials?.password) {
            console.log("DEBUG - Authorize: Missing credentials");
            return null;
          }

          const user = await (prisma as any).user.findUnique({
            where: { email: credentials.email },
            include: { store: true },
          });

          if (!user) {
            console.log("DEBUG - Authorize: User not found", credentials.email);
            return null;
          }

          console.log("DEBUG - Authorize: User found, checking password...");
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            console.log("DEBUG - Authorize: Invalid password");
            return null;
          }

          console.log("DEBUG - Authorize: Success for", user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            storeSlug: user.store?.slug ?? null,
          };
        } catch (error: any) {
          console.error("DEBUG - Authorize CRITICAL ERROR:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("DEBUG - Auth Callback JWT: User found", user.id);
        token.id = user.id;
        token.role = (user as any).role; // Incluindo role no token
        token.storeSlug = (user as any).storeSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role; // Passando role para a sessão
        (session.user as any).storeSlug = token.storeSlug;
      }
      return session;
    },
  },
};
