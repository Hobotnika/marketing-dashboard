import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { encrypt } from '@/lib/db/encryption';
import { eq } from 'drizzle-orm';

// GET /api/admin/organizations/[id] - Get single organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check super admin auth
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, params.id),
      with: {
        users: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/organizations/[id] - Update organization
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check super admin auth
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      subdomain,
      calendlyAccessToken,
      stripeSecretKey,
      googleSheetsId,
      metaAccessToken,
      status,
    } = body;

    // Check if organization exists
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.id, params.id),
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // If subdomain is changing, check it doesn't already exist
    if (subdomain && subdomain !== existingOrg.subdomain) {
      const subdomainExists = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.subdomain, subdomain),
      });

      if (subdomainExists) {
        return NextResponse.json(
          { error: 'Subdomain already exists' },
          { status: 400 }
        );
      }
    }

    // Build update object - only update fields that are provided
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (subdomain !== undefined) updateData.subdomain = subdomain;
    if (status !== undefined) updateData.status = status;
    if (googleSheetsId !== undefined) updateData.googleSheetsId = googleSheetsId;

    // Encrypt API keys if provided
    if (calendlyAccessToken !== undefined) {
      updateData.calendlyAccessToken = calendlyAccessToken
        ? encrypt(calendlyAccessToken)
        : null;
    }
    if (stripeSecretKey !== undefined) {
      updateData.stripeSecretKey = stripeSecretKey
        ? encrypt(stripeSecretKey)
        : null;
    }
    if (metaAccessToken !== undefined) {
      updateData.metaAccessToken = metaAccessToken
        ? encrypt(metaAccessToken)
        : null;
    }

    // Update organization
    const [updatedOrg] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, params.id))
      .returning();

    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/organizations/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check super admin auth
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    // Check if organization exists
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.id, params.id),
      with: {
        users: true,
      },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Note: This will cascade delete all users due to foreign key constraint
    // Make sure the schema has ON DELETE CASCADE
    await db.delete(organizations).where(eq(organizations.id, params.id));

    return NextResponse.json({
      message: 'Organization deleted successfully',
      deletedOrganization: existingOrg.name,
      deletedUsers: existingOrg.users.length,
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
