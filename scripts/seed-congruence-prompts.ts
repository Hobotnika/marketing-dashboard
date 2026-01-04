import './load-env';
import { db } from '../lib/db';
import { organizations, users } from '../lib/db/schema';
import { seedDefaultCongruencePrompts, seedAllBusinessOSPrompts } from '../lib/db/seed-prompts';
import { eq } from 'drizzle-orm';

async function seedCongruencePrompts() {
  console.log('🌱 Seeding Congruence prompts...\n');

  try {
    // Find demo organization
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.subdomain, 'demo'),
    });

    if (!org) {
      console.error('❌ Demo organization not found. Please run seed first.');
      process.exit(1);
    }

    // Find admin user
    const user = await db.query.users.findFirst({
      where: eq(users.organizationId, org.id),
    });

    if (!user) {
      console.error('❌ Admin user not found. Please run seed first.');
      process.exit(1);
    }

    console.log(`📦 Organization: ${org.name} (${org.subdomain})`);
    console.log(`👤 User: ${user.email}\n`);

    // Seed all Business OS prompts (KPIS + Congruence)
    console.log('🤖 Seeding Business OS AI prompts...');
    await seedAllBusinessOSPrompts(org.id, user.id);

    console.log('\n✅ Congruence prompts seeded successfully!\n');
    console.log('Available prompts:');
    console.log('  - KPIS: Weekly Trend Analysis, Action Items Generator');
    console.log('  - Congruence: Pattern Analyzer, Motivation Coach\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedCongruencePrompts();
