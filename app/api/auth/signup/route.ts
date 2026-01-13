import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate subdomain from name (lowercase, no spaces, alphanumeric only)
    const baseSubdomain = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const subdomain = `${baseSubdomain}-${randomSuffix}`;

    // Create organization for this user
    const [organization] = await db
      .insert(organizations)
      .values({
        name: `${name}'s Organization`,
        subdomain: subdomain,
        status: 'trial',
      })
      .returning();

    if (!organization) {
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Create user linked to the organization
    const [user] = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        organizationId: organization.id,
        role: 'admin', // First user is always admin
      })
      .returning();

    if (!user) {
      // Rollback: delete the organization if user creation fails
      await db.delete(organizations).where(eq(organizations.id, organization.id));
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          subdomain: organization.subdomain,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating your account' },
      { status: 500 }
    );
  }
}
