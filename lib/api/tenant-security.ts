import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { workspaces, apiLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Tenant Context - derived from subdomain headers set by middleware
 * Note: "Tenant" refers to workspace in multi-workspace architecture
 */
export interface TenantContext {
  workspaceId: string;
  workspaceSubdomain: string;
  workspaceName: string;
  workspace: any; // Full workspace object with credentials
}

/**
 * Security Context - includes both tenant and user information
 */
export interface SecurityContext extends TenantContext {
  userId: string;
  userEmail: string;
  userRole: 'owner' | 'admin' | 'member' | 'viewer';
}

/**
 * Get tenant context from request headers
 * Headers are set by middleware after validating the subdomain
 *
 * CRITICAL: This derives tenant from subdomain, NOT from client input!
 */
export async function getTenantContext(): Promise<TenantContext> {
  const headersList = await headers();

  const workspaceId = headersList.get('x-organization-id');
  const workspaceSubdomain = headersList.get('x-organization-subdomain');
  const workspaceName = headersList.get('x-organization-name');

  // Debug logging
  console.log('getTenantContext - Headers:', {
    workspaceId: workspaceId || 'missing',
    workspaceSubdomain: workspaceSubdomain || 'missing',
    workspaceName: workspaceName || 'missing',
    host: headersList.get('host') || 'missing',
  });

  // If headers are missing, it means middleware didn't set them
  // This should only happen on non-tenant routes (main domain, admin)
  if (!workspaceId || !workspaceSubdomain) {
    throw new Error(
      `Tenant context not found - not a tenant subdomain. ` +
      `Headers: orgId=${workspaceId || 'missing'}, ` +
      `subdomain=${workspaceSubdomain || 'missing'}, ` +
      `host=${headersList.get('host') || 'missing'}`
    );
  }

  // Fetch full workspace data (including encrypted credentials)
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    throw new Error('Workspace not found in database');
  }

  return {
    workspaceId,
    workspaceSubdomain,
    workspaceName: workspaceName || workspace.name,
    workspace,
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
  // Never trust workspaceId from frontend - always derive from session
  if (session.user.workspaceId !== tenantContext.workspaceId) {
    // Log security violation
    await logSecurityViolation({
      userId: session.user.id,
      userEmail: session.user.email, // Already validated above
      userOrganizationId: session.user.workspaceId,
      attemptedOrganizationId: tenantContext.workspaceId,
      route: 'unknown', // Will be set by caller
      message: 'User attempted to access different tenant data',
    });

    throw new Error(
      `Unauthorized - user belongs to ${session.user.workspaceName} but tried to access ${tenantContext.workspaceName}`
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
  workspaceId: string;
  apiName: string;
  endpoint: string;
  status: 'success' | 'error';
  errorMessage?: string;
}) {
  try {
    await db.insert(apiLogs).values({
      userId: data.userId,
      workspaceId: data.workspaceId,
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
      workspaceId: data.attemptedOrganizationId,
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
 *   // context.userId, context.workspaceId are already validated
 *   const data = await fetchData(context.workspaceId);
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
        workspaceId: securityContext.workspaceId,
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
            workspaceId: session.user.workspaceId,
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
