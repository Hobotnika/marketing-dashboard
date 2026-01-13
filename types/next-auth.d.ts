import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      workspaceId: string; // Currently active workspace
      workspaceName: string;
      workspaceSubdomain: string;
      role: 'owner' | 'admin' | 'member' | 'viewer'; // Role in current workspace
      workspaces: Array<{ // All workspaces user has access to
        id: string;
        name: string;
        subdomain: string;
        role: 'owner' | 'admin' | 'member' | 'viewer';
      }>;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    workspaceId: string;
    workspaceName: string;
    workspaceSubdomain: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    workspaces: Array<{
      id: string;
      name: string;
      subdomain: string;
      role: 'owner' | 'admin' | 'member' | 'viewer';
    }>;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    workspaceId: string;
    workspaceName: string;
    workspaceSubdomain: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    workspaces: Array<{
      id: string;
      name: string;
      subdomain: string;
      role: 'owner' | 'admin' | 'member' | 'viewer';
    }>;
  }
}
