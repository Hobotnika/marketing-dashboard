import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations, users } from '@/lib/db/schema';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { encrypt } from '@/lib/db/encryption';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

// GET /api/admin/organizations - List all organizations
export async function GET() {
  try {
    // Check super admin auth
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    // Fetch all organizations with users
    const allOrganizations = await db.query.organizations.findMany({
      with: {
        users: true,
      },
      orderBy: (organizations, { desc }) => [desc(organizations.createdAt)],
    });

    return NextResponse.json(allOrganizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// POST /api/admin/organizations - Create new organization
export async function POST(request: NextRequest) {
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
      adminEmail,
      adminName,
    } = body;

    // Validate required fields
    if (!name || !subdomain) {
      return NextResponse.json(
        { error: 'Name and subdomain are required' },
        { status: 400 }
      );
    }

    // Validate subdomain format (lowercase, alphanumeric, hyphens)
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { error: 'Subdomain must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      );
    }

    // Check if subdomain already exists
    const existingOrg = await db.query.organizations.findFirst({
      where: (orgs, { eq }) => eq(orgs.subdomain, subdomain),
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Subdomain already exists' },
        { status: 400 }
      );
    }

    // Encrypt API keys if provided
    const encryptedCalendly = calendlyAccessToken
      ? encrypt(calendlyAccessToken)
      : null;
    const encryptedStripe = stripeSecretKey ? encrypt(stripeSecretKey) : null;
    const encryptedMeta = metaAccessToken ? encrypt(metaAccessToken) : null;

    // Create organization
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name,
        subdomain,
        calendlyAccessToken: encryptedCalendly,
        stripeSecretKey: encryptedStripe,
        googleSheetsId,
        metaAccessToken: encryptedMeta,
        status: status || 'trial',
      })
      .returning();

    // Create first admin user if email and name provided
    let newUser = null;
    if (adminEmail && adminName) {
      // Generate temporary password
      const tempPassword = nanoid(12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      [newUser] = await db
        .insert(users)
        .values({
          email: adminEmail,
          passwordHash,
          name: adminName,
          organizationId: newOrg.id,
          role: 'admin',
        })
        .returning();

      // Return the temp password in response (only shown once!)
      return NextResponse.json({
        organization: newOrg,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          temporaryPassword: tempPassword,
        },
      });
    }

    return NextResponse.json({ organization: newOrg });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
