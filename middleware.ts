import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes (except auth check below)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Get subdomain from host
  const host = request.headers.get('host') || '';
  const subdomain = getSubdomain(host);

  console.log('Middleware - Host:', host, 'Subdomain:', subdomain);

  // Allow login page without subdomain check
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  const session = await auth();

  // If not authenticated, redirect to login
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify user belongs to the subdomain's organization
  if (subdomain && session.user.organizationSubdomain !== subdomain) {
    console.log(
      'Unauthorized access attempt:',
      `User from ${session.user.organizationSubdomain} trying to access ${subdomain}`
    );

    return new NextResponse(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'You do not have access to this organization',
      }),
      {
        status: 403,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  // Add organization context to headers for API routes
  const response = NextResponse.next();
  if (session.user.organizationId) {
    response.headers.set('x-organization-id', session.user.organizationId);
    response.headers.set('x-organization-subdomain', session.user.organizationSubdomain);
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-role', session.user.role);
  }

  return response;
}

/**
 * Extract subdomain from host
 * Examples:
 * - demo.localhost:3000 → "demo"
 * - demo.yourdomain.com → "demo"
 * - localhost:3000 → null (no subdomain)
 * - yourdomain.com → null (no subdomain)
 */
function getSubdomain(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(':')[0];

  // Split by dots
  const parts = hostWithoutPort.split('.');

  // If localhost with subdomain (e.g., demo.localhost)
  if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
    return parts[0];
  }

  // If production domain with subdomain (e.g., demo.yourdomain.com)
  if (parts.length >= 3) {
    // Exclude 'www' as a subdomain
    if (parts[0] === 'www') {
      return null;
    }
    return parts[0];
  }

  // No subdomain
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.gif$).*)',
  ],
};

// Use Node.js runtime to support bcrypt and other Node modules
export const runtime = 'nodejs';
