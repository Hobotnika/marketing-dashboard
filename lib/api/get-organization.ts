import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * Get organization from middleware headers
 * Middleware sets x-organization-id header for tenant subdomains
 */
export async function getOrganizationFromHeaders() {
  const headersList = await headers();
  const organizationId = headersList.get('x-organization-id');

  if (!organizationId) {
    return {
      error: NextResponse.json(
        { error: 'Organization not found in request' },
        { status: 400 }
      ),
      organization: null,
    };
  }

  // Fetch organization from database
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!organization) {
    return {
      error: NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      ),
      organization: null,
    };
  }

  return {
    error: null,
    organization,
  };
}

/**
 * Get organization ID from middleware headers (simpler version)
 */
export async function getOrganizationId(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('x-organization-id');
}

/**
 * Get organization subdomain from middleware headers
 */
export async function getOrganizationSubdomain(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('x-organization-subdomain');
}
