import './load-env';
import { db } from '../lib/db';
import { organizations, users } from '../lib/db/schema';
import { generateEncryptionKey } from '../lib/db/encryption';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Check if encryption key is set
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.includes('your_encryption_key_here')) {
      console.log('⚠️  WARNING: ENCRYPTION_KEY not set in .env.local');
      console.log('Generate one with:');
      console.log('  openssl rand -hex 32');
      console.log('or');
      console.log('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      console.log('\nGenerated key for you:');
      console.log(generateEncryptionKey());
      console.log('\nPlease add this to your .env.local file as ENCRYPTION_KEY and run seed again.\n');
      process.exit(1);
    }

    // 1. Create demo organization
    console.log('📦 Creating demo organization...');
    const [organization] = await db.insert(organizations).values({
      name: 'Demo Client',
      subdomain: 'demo',
      status: 'trial',
    }).returning();

    console.log(`✓ Created organization: ${organization.name} (subdomain: ${organization.subdomain})`);

    // 2. Create admin user
    console.log('\n👤 Creating admin user...');
    const passwordHash = await bcrypt.hash('demo123', 10);

    const [user] = await db.insert(users).values({
      email: 'admin@demo.com',
      passwordHash,
      name: 'Demo Admin',
      organizationId: organization.id,
      role: 'admin',
    }).returning();

    console.log(`✓ Created user: ${user.email} (role: ${user.role})`);
    console.log(`  Password: demo123`);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('📝 Login credentials:');
    console.log('  Email: admin@demo.com');
    console.log('  Password: demo123');
    console.log('  Subdomain: demo\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
