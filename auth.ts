import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './lib/db';
import { users, organizations } from './lib/db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Find user by email
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
            with: {
              organization: true,
            },
          });

          if (!user) {
            console.log('User not found:', email);
            return null;
          }

          // Verify password
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            console.log('Invalid password for user:', email);
            return null;
          }

          // Return user object that will be encoded in JWT
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
            organizationSubdomain: user.organization.subdomain,
            role: user.role,
          };
        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to JWT token on sign in
      if (user) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.organizationSubdomain = user.organizationSubdomain;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data from JWT to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.organizationSubdomain = token.organizationSubdomain as string;
        session.user.role = token.role as 'admin' | 'viewer';
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
