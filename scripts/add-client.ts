import './load-env';
import { db } from '../lib/db';
import { organizations, users } from '../lib/db/schema';
import { encryptApiKey } from '../lib/db/encryption';
import bcrypt from 'bcryptjs';
import * as readline from 'readline/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function addClient() {
  console.log('\n🏢 Add New Client to Marketing Dashboard\n');

  try {
    // Get organization details
    const name = await rl.question('Organization name: ');
    const subdomain = await rl.question('Subdomain (e.g., "palm" for palm.yourdomain.com): ');
    const status = await rl.question('Status (trial/active/inactive) [trial]: ') || 'trial';

    // Validate status
    if (!['trial', 'active', 'inactive'].includes(status)) {
      console.error('❌ Invalid status. Must be: trial, active, or inactive');
      process.exit(1);
    }

    // Get user details
    console.log('\n👤 Admin User Details:\n');
    const email = await rl.question('Email: ');
    const userName = await rl.question('Full name: ');
    const password = await rl.question('Password: ');

    // Get API credentials (optional)
    console.log('\n🔑 API Credentials (optional, press Enter to skip):\n');
    const calendlyToken = await rl.question('Calendly Access Token: ');
    const calendlyUserUri = await rl.question('Calendly User URI: ');
    const stripeKey = await rl.question('Stripe Secret Key: ');
    const googleSheetsId = await rl.question('Google Sheets ID: ');
    const metaToken = await rl.question('Meta Access Token: ');

    rl.close();

    console.log('\n📦 Creating organization...');

    // Create organization
    const [org] = await db.insert(organizations).values({
      name,
      subdomain,
      status: status as 'trial' | 'active' | 'inactive',
      calendlyAccessToken: calendlyToken ? encryptApiKey(calendlyToken) : null,
      calendlyUserUri: calendlyUserUri || null,
      stripeSecretKey: stripeKey ? encryptApiKey(stripeKey) : null,
      googleSheetsId: googleSheetsId || null,
      metaAccessToken: metaToken ? encryptApiKey(metaToken) : null,
    }).returning();

    console.log(`✓ Created organization: ${org.name} (ID: ${org.id})`);

    // Create admin user
    console.log('👤 Creating admin user...');
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      name: userName,
      organizationId: org.id,
      role: 'admin',
    }).returning();

    console.log(`✓ Created user: ${user.email}`);

    console.log('\n✅ Client added successfully!\n');
    console.log('📝 Login credentials:');
    console.log(`  URL: https://${subdomain}.yourdomain.com`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Organization: ${name}\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to add client:', error.message);

    if (error.code === '23505') {
      console.error('\n⚠️  Duplicate entry detected:');
      if (error.constraint?.includes('subdomain')) {
        console.error('   Subdomain already exists. Choose a different subdomain.');
      } else if (error.constraint?.includes('email')) {
        console.error('   Email already exists. Choose a different email.');
      }
    }

    rl.close();
    process.exit(1);
  }
}

addClient();
