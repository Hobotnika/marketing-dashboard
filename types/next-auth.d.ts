import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      organizationName: string;
      organizationSubdomain: string;
      role: 'admin' | 'viewer';
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    organizationId: string;
    organizationName: string;
    organizationSubdomain: string;
    role: 'admin' | 'viewer';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    organizationId: string;
    organizationName: string;
    organizationSubdomain: string;
    role: 'admin' | 'viewer';
  }
}
