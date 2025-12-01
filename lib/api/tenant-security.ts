import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { organizations, apiLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Tenant Context - derived from subdomain headers set by middleware
 */
export interface TenantContext {
  organizationId: string;
  organizationSubdomain: string;
  organizationName: string;
  organization: any; // Full organization object with credentials
}

/**
 * Security Context - includes both tenant and user information
 */
export interface SecurityContext extends TenantContext {
  userId: string;
  userEmail: string;
  userRole: 'admin' | 'viewer';
}

/**
 * Get tenant context from request headers
 * Headers are set by middleware after validating the subdomain
 *
 * CRITICAL: This derives tenant from subdomain, NOT from client input!
 */
export async function getTenantContext(): Promise<TenantContext> {
  const headersList = await headers();

  const organizationId = headersList.get('x-organization-id');
  const organizationSubdomain = headersList.get('x-organization-subdomain');
  const organizationName = headersList.get('x-organization-name');

  // If headers are missing, it means middleware didn't set them
  // This should only happen on non-tenant routes (main domain, admin)
  if (!organizationId || !organizationSubdomain) {
    throw new Error('Tenant context not found - not a tenant subdomain');
  }

  // Fetch full organization data (including encrypted credentials)
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!organization) {
    throw new Error('Organization not found in database');
  }

  return {
    organizationId,
    organizationSubdomain,
    organizationName: organizationName || organization.name,
    organization,
  };
}

/**
 * Protect tenant route - validates user session and tenant access
 *
 * SECURITY CHECKS:
 * 1. User is authenticated (has valid session)
 * 2. User belongs to the current tenant organization
 * 3. Tenant context is valid
 *
 * @throws Error if security checks fail
 * @returns SecurityContext with validated user and tenant data
 */
export async function protectTenantRoute(): Promise<SecurityContext> {
  // 1. Get authenticated session
  const session = await auth();

  if (!session || !session.user || !session.user.email) {
    throw new Error('Unauthorized - authentication required');
  }

  // 2. Get tenant context from subdomain
  const tenantContext = await getTenantContext();

  // 3. CRITICAL SECURITY CHECK: Verify user belongs to THIS tenant
  // Never trust organizationId from frontend - always derive from session
  if (session.user.organizationId !== tenantContext.organizationId) {
    // Log security violation
    await logSecurityViolation({
      userId: session.user.id,
      userEmail: session.user.email, // Already validated above
      userOrganizationId: session.user.organizationId,
      attemptedOrganizationId: tenantContext.organizationId,
      route: 'unknown', // Will be set by caller
      message: 'User attempted to access different tenant data',
    });

    throw new Error(
      `Unauthorized - user belongs to ${session.user.organizationName} but tried to access ${tenantContext.organizationName}`
    );
  }

  // 4. Return validated security context
  return {
    ...tenantContext,
    userId: session.user.id,
    userEmail: session.user.email, // Already validated above
    userRole: session.user.role,
  };
}

/**
 * Log API request for audit trail
 */
export async function logApiRequest(data: {
  userId: string;
  organizationId: string;
  apiName: string;
  endpoint: string;
  status: 'success' | 'error';
  errorMessage?: string;
}) {
  try {
    await db.insert(apiLogs).values({
      userId: data.userId,
      organizationId: data.organizationId,
      apiName: data.apiName,
      endpoint: data.endpoint,
      status: data.status,
      errorMessage: data.errorMessage,
    });
  } catch (error) {
    // Don't fail request if logging fails, but log to console
    console.error('Failed to log API request:', error);
  }
}

/**
 * Log security violation for audit trail
 */
async function logSecurityViolation(data: {
  userId: string;
  userEmail: string;
  userOrganizationId: string;
  attemptedOrganizationId: string;
  route: string;
  message: string;
}) {
  try {
    await db.insert(apiLogs).values({
      userId: data.userId,
      organizationId: data.attemptedOrganizationId,
      apiName: 'SECURITY_VIOLATION',
      endpoint: data.route,
      status: 'error',
      errorMessage: `${data.message} | User: ${data.userEmail} | User Org: ${data.userOrganizationId} | Attempted Org: ${data.attemptedOrganizationId}`,
    });

    // Also log to console for immediate visibility
    console.error('🚨 SECURITY VIOLATION:', data);
  } catch (error) {
    console.error('Failed to log security violation:', error);
  }
}

/**
 * Helper to create standardized API error responses
 */
export function createApiError(message: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Wrapper for API route handlers that automatically applies security
 *
 * Usage:
 * export const GET = withTenantSecurity(async (request, context) => {
 *   // context.userId, context.organizationId are already validated
 *   const data = await fetchData(context.organizationId);
 *   return NextResponse.json(data);
 * });
 */
export function withTenantSecurity(
  handler: (
    request: Request | NextRequest,
    context: SecurityContext
  ) => Promise<NextResponse<any>>
) {
  return async (request: Request | NextRequest): Promise<NextResponse<any>> => {
    try {
      // Apply security checks
      const securityContext = await protectTenantRoute();

      // Execute handler with validated context
      const response = await handler(request, securityContext);

      // Extract API name from endpoint (e.g., "/api/calendly/events" -> "calendly")
      const endpoint = new URL(request.url).pathname;
      const apiNameMatch = endpoint.match(/\/api\/([^/]+)/);
      const apiName = apiNameMatch ? apiNameMatch[1] : 'unknown';

      // Log successful request
      await logApiRequest({
        userId: securityContext.userId,
        organizationId: securityContext.organizationId,
        apiName,
        endpoint,
        status: 'success',
      });

      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';

      // Try to log the error (might fail if user/tenant not available)
      try {
        const session = await auth();
        if (session?.user) {
          const endpoint = new URL(request.url).pathname;
          const apiNameMatch = endpoint.match(/\/api\/([^/]+)/);
          const apiName = apiNameMatch ? apiNameMatch[1] : 'unknown';

          await logApiRequest({
            userId: session.user.id,
            organizationId: session.user.organizationId,
            apiName,
            endpoint,
            status: 'error',
            errorMessage,
          });
        }
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }

      console.error('API Error:', error);

      // Determine status code
      let statusCode = 500;
      if (error.message.includes('Unauthorized')) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }

      return createApiError(errorMessage, statusCode);
    }
  };
}
