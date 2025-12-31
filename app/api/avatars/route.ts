import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customerAvatars } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { Avatar, AvatarPersonaData } from '@/types/avatar';

/**
 * GET /api/avatars
 * List all avatar sets for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID not found' },
        { status: 400 }
      );
    }

    // Fetch all avatars for this organization
    const avatars = await db
      .select()
      .from(customerAvatars)
      .where(
        and(
          eq(customerAvatars.organizationId, organizationId),
          eq(customerAvatars.isActive, true)
        )
      )
      .orderBy(customerAvatars.createdAt);

    // Group avatars by setName
    const avatarSets: Record<string, any> = {};

    for (const avatar of avatars) {
      if (!avatarSets[avatar.setName]) {
        avatarSets[avatar.setName] = {
          setName: avatar.setName,
          niche: avatar.niche,
          description: avatar.description,
          count: 0,
          avatars: [],
          createdAt: avatar.createdAt,
        };
      }

      avatarSets[avatar.setName].count++;

      // Parse persona data
      let personaData: AvatarPersonaData;
      try {
        personaData = JSON.parse(avatar.personaData);
      } catch {
        continue; // Skip invalid persona data
      }

      avatarSets[avatar.setName].avatars.push({
        id: avatar.id,
        name: avatar.avatarName,
        ...personaData,
      });
    }

    return NextResponse.json({
      success: true,
      avatarSets: Object.values(avatarSets),
    });
  } catch (error) {
    console.error('Error fetching avatar sets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch avatar sets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/avatars
 * Save avatar set to database
 */
export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID not found' },
        { status: 400 }
      );
    }

    const { setName, niche, description, avatars } = await request.json();

    if (!setName || !niche || !avatars || !Array.isArray(avatars)) {
      return NextResponse.json(
        { success: false, error: 'setName, niche, and avatars array are required' },
        { status: 400 }
      );
    }

    if (avatars.length < 12 || avatars.length > 15) {
      return NextResponse.json(
        { success: false, error: '12-15 avatars are required' },
        { status: 400 }
      );
    }

    // Check if avatar set with this name already exists
    const existing = await db
      .select()
      .from(customerAvatars)
      .where(
        and(
          eq(customerAvatars.organizationId, organizationId),
          eq(customerAvatars.setName, setName)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Avatar set "${setName}" already exists` },
        { status: 400 }
      );
    }

    // Insert all avatars
    const now = new Date().toISOString();
    const avatarRecords = avatars.map((avatar: Avatar) => {
      const personaData: AvatarPersonaData = {
        demographics: avatar.demographics,
        psychographics: avatar.psychographics,
        buying_behavior: avatar.buying_behavior,
        communication_style: avatar.communication_style,
        prompt_persona: avatar.prompt_persona,
      };

      return {
        organizationId,
        setName,
        niche,
        description: description || null,
        avatarName: avatar.name,
        personaData: JSON.stringify(personaData),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
    });

    await db.insert(customerAvatars).values(avatarRecords);

    return NextResponse.json({
      success: true,
      message: `Saved ${avatars.length} avatars to set "${setName}"`,
    });
  } catch (error) {
    console.error('Error saving avatars:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save avatars' },
      { status: 500 }
    );
  }
}
