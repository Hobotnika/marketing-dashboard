import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth';
import { db } from './lib/db';
import { organizations } from './lib/db/schema';
import { eq } from 'drizzle-orm';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files only
  if (
    pathname.startsWith('/_next') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Get subdomain from host
  const host = request.headers.get('host') || '';
  const subdomain = getSubdomain(host);

  console.log('Middleware - Host:', host, 'Path:', pathname, 'Subdomain:', subdomain || 'none');

  // Handle API routes - need to set tenant context headers but skip auth redirects
  if (pathname.startsWith('/api')) {
    // For tenant subdomains, set organization headers for API routes
    if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
      try {
        const organization = await db.query.organizations.findFirst({
          where: eq(organizations.subdomain, subdomain),
        });

        if (organization) {
          const session = await auth();
          const response = NextResponse.next();

          // Set tenant context headers
          response.headers.set('x-organization-id', organization.id);
          response.headers.set('x-organization-subdomain', organization.subdomain);
          response.headers.set('x-organization-name', organization.name);

          // Set user context if authenticated
          if (session) {
            response.headers.set('x-user-id', session.user.id);
            response.headers.set('x-user-role', session.user.role);
          }

          console.log('API Route - Set tenant headers:', {
            orgId: organization.id,
            subdomain: organization.subdomain,
            userId: session?.user.id || 'none',
          });

          return response;
        }
      } catch (error) {
        console.error('Error setting API tenant context:', error);
      }
    }

    // For non-tenant API routes, just pass through
    return NextResponse.next();
  }

  // CASE 1: Main domain (no subdomain or www) → Landing page
  if (!subdomain || subdomain === 'www') {
    // Allow access to landing page and login
    if (pathname === '/' || pathname === '/login') {
      return NextResponse.next();
    }

    // Redirect other paths to landing page
    return NextResponse.redirect(new URL('/', request.url));
  }

  // CASE 2: Admin subdomain → Admin panel
  if (subdomain === 'admin') {
    // Allow access to login page without authentication check
    if (pathname === '/login') {
      console.log('Admin login page - allowing access');
      return NextResponse.next();
    }

    // For all other routes on admin subdomain, check authentication
    const session = await auth();
    console.log('Admin subdomain - Session:', session ? 'exists' : 'null', 'Path:', pathname);

    // If not authenticated, redirect to login
    if (!session) {
      console.log('No session - redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated - allow access to admin panel
    // Temporarily allow any authenticated user (will add role check later)
    if (pathname.startsWith('/admin')) {
      console.log('Authenticated - allowing access to admin panel');
      const response = NextResponse.next();
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-role', session.user.role);
      response.headers.set('x-subdomain-type', 'admin');
      return response;
    }

    // Redirect root to /admin
    if (pathname === '/') {
      console.log('Root path - redirecting to /admin');
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    console.log('Admin subdomain - allowing next');
    return NextResponse.next();
  }

  // CASE 3: Client subdomain → Check organization exists
  try {
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.subdomain, subdomain),
    });

    if (!organization) {
      // Organization not found → 404
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Organization Not Found</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                background: linear-gradient(to bottom right, #1f2937, #111827, #000);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
              }
              .container {
                text-align: center;
                max-width: 500px;
                padding: 2rem;
              }
              h1 {
                font-size: 4rem;
                margin: 0;
                color: #ef4444;
              }
              h2 {
                font-size: 1.5rem;
                margin: 1rem 0;
              }
              p {
                color: #9ca3af;
                margin: 1rem 0;
              }
              code {
                background: #374151;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                color: #10b981;
              }
              a {
                display: inline-block;
                margin-top: 2rem;
                padding: 0.75rem 1.5rem;
                background: #10b981;
                color: white;
                text-decoration: none;
                border-radius: 0.5rem;
                font-weight: 600;
                transition: background 0.2s;
              }
              a:hover {
                background: #059669;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>404</h1>
              <h2>Organization Not Found</h2>
              <p>
                The subdomain <code>${subdomain}</code> is not associated with any organization.
              </p>
              <p>
                Please check the URL or contact your administrator.
              </p>
              <a href="http://${host.replace(`${subdomain}.`, '')}">Go to Homepage</a>
            </div>
          </body>
        </html>
        `,
        {
          status: 404,
          headers: { 'content-type': 'text/html' },
        }
      );
    }

    // Organization exists → Check authentication
    const session = await auth();

    // Allow access to login page
    if (pathname === '/login') {
      // If already authenticated, redirect to dashboard
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Require authentication for all other pages
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify user belongs to this organization
    if (session.user.organizationSubdomain !== subdomain) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Access Denied</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                background: linear-gradient(to bottom right, #1f2937, #111827, #000);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
              }
              .container {
                text-align: center;
                max-width: 500px;
                padding: 2rem;
              }
              h1 {
                font-size: 4rem;
                margin: 0;
                color: #ef4444;
              }
              h2 {
                font-size: 1.5rem;
                margin: 1rem 0;
              }
              p {
                color: #9ca3af;
                margin: 1rem 0;
              }
              code {
                background: #374151;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                color: #10b981;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>403</h1>
              <h2>Access Denied</h2>
              <p>
                You are logged in to <code>${session.user.organizationName}</code> but trying to access <code>${organization.name}</code>.
              </p>
              <p>
                Please log out and sign in with an account that has access to this organization.
              </p>
            </div>
          </body>
        </html>
        `,
        {
          status: 403,
          headers: { 'content-type': 'text/html' },
        }
      );
    }

    // User is authenticated and belongs to organization
    // Redirect root to /dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow access to dashboard and other tenant routes
    const response = NextResponse.next();
    response.headers.set('x-organization-id', organization.id);
    response.headers.set('x-organization-subdomain', organization.subdomain);
    response.headers.set('x-organization-name', organization.name);
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-role', session.user.role);
    response.headers.set('x-subdomain-type', 'tenant');

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Extract subdomain from host
 * Examples:
 * - demo.localhost:3000 → "demo"
 * - admin.localhost:3000 → "admin"
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
