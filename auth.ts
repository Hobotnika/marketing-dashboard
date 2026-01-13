import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './lib/db';
import { users, workspaces, userWorkspaces } from './lib/db/schema';
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
              currentWorkspace: true,
              userWorkspaces: {
                with: {
                  workspace: true,
                },
              },
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

          // User must have at least one workspace
          if (!user.userWorkspaces || user.userWorkspaces.length === 0) {
            console.log('User has no workspaces:', email);
            return null;
          }

          // Determine current workspace (use currentWorkspaceId if set, otherwise first workspace)
          let currentWorkspace = user.currentWorkspace;
          let currentRole = user.userWorkspaces.find(
            uw => uw.workspace.id === currentWorkspace?.id
          )?.role;

          if (!currentWorkspace || !currentRole) {
            // Fallback to first workspace
            currentWorkspace = user.userWorkspaces[0].workspace;
            currentRole = user.userWorkspaces[0].role;
          }

          // Build list of all workspaces user has access to
          const userWorkspacesList = user.userWorkspaces.map(uw => ({
            id: uw.workspace.id,
            name: uw.workspace.name,
            subdomain: uw.workspace.subdomain,
            role: uw.role,
          }));

          // Return user object that will be encoded in JWT
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            workspaceId: currentWorkspace.id,
            workspaceName: currentWorkspace.name,
            workspaceSubdomain: currentWorkspace.subdomain,
            role: currentRole,
            workspaces: userWorkspacesList,
          };
        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to JWT token on sign in
      if (user) {
        token.id = user.id;
        token.workspaceId = user.workspaceId;
        token.workspaceName = user.workspaceName;
        token.workspaceSubdomain = user.workspaceSubdomain;
        token.role = user.role;
        token.workspaces = user.workspaces;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data from JWT to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.workspaceId = token.workspaceId as string;
        session.user.workspaceName = token.workspaceName as string;
        session.user.workspaceSubdomain = token.workspaceSubdomain as string;
        session.user.role = token.role as 'owner' | 'admin' | 'member' | 'viewer';
        session.user.workspaces = token.workspaces as Array<{
          id: string;
          name: string;
          subdomain: string;
          role: 'owner' | 'admin' | 'member' | 'viewer';
        }>;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
