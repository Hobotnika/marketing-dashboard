# Multi-Tenant Database Setup

This guide explains how to set up and manage the multi-tenant PostgreSQL database for the Marketing Dashboard.

## Overview

The system uses a **multi-tenant architecture** where each client has:
- Their own subdomain (e.g., `palm.yourdomain.com`, `courses.yourdomain.com`)
- Their own API credentials (stored encrypted)
- Separate user accounts

## Stack

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Encryption**: Node.js crypto (AES-256-GCM)

## Schema

### Tables

1. **organizations** - Each client/tenant
   - Stores subdomain, company name, logo
   - Encrypted API credentials (Calendly, Stripe, Google, Meta)
   - Status: active, inactive, or trial

2. **users** - People who log in
   - Email, password hash, name
   - Linked to organization
   - Role: admin or viewer

3. **api_logs** - Audit trail
   - Tracks all API calls per organization
   - Success/error status
   - Timestamp and error messages

## Initial Setup

### 1. Install PostgreSQL

**macOS (with Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE marketing_dashboard;

# Create user (optional)
CREATE USER marketing_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE marketing_dashboard TO marketing_user;

# Exit
\q
```

### 3. Generate Encryption Key

```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configure Environment

Update `.env.local`:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/marketing_dashboard

# Encryption key (64 hex characters = 32 bytes)
ENCRYPTION_KEY=your_generated_encryption_key_here
```

**For production (e.g., Vercel):**
```bash
DATABASE_URL=postgresql://user:password@your-db-host.com:5432/marketing_dashboard?sslmode=require
```

### 5. Run Migrations

```bash
# Push schema to database (creates all tables)
npm run db:push

# Or generate and run migrations (recommended for production)
npm run db:generate
npm run db:migrate
```

### 6. Seed Demo Data

```bash
npm run db:seed
```

This creates:
- Organization: "Demo Client" (subdomain: `demo`)
- User: `admin@demo.com` / `demo123` (admin role)

## Database Commands

```bash
# Generate new migration after schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Open Drizzle Studio (GUI for database)
npm run db:studio

# Seed demo data
npm run db:seed
```

## Adding New Clients (Manual)

### Option 1: Using Drizzle Studio (Recommended)

```bash
npm run db:studio
```

1. Open http://localhost:4983
2. Go to `organizations` table → Add new row:
   - name: "Client Name"
   - subdomain: "clientsubdomain"
   - status: "trial" or "active"
3. Go to `users` table → Add new row:
   - email: "admin@client.com"
   - name: "Admin Name"
   - password_hash: (generate with script below)
   - organization_id: (select from dropdown)
   - role: "admin"

**Generate password hash:**
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(console.log)"
```

### Option 2: Using SQL

```sql
-- 1. Insert organization
INSERT INTO organizations (name, subdomain, status)
VALUES ('Palm Exotic Rentals', 'palm', 'active')
RETURNING id;

-- 2. Insert user (replace organization_id and password_hash)
INSERT INTO users (email, password_hash, name, organization_id, role)
VALUES (
  'admin@palm.com',
  '$2a$10$your_bcrypt_hash_here',
  'Palm Admin',
  'organization_id_from_step_1',
  'admin'
);
```

### Option 3: Using TypeScript Script

Create `scripts/add-client.ts`:

```typescript
import 'dotenv/config';
import { db } from '../lib/db';
import { organizations, users } from '../lib/db/schema';
import bcrypt from 'bcryptjs';

async function addClient() {
  const subdomain = 'palm';
  const email = 'admin@palm.com';
  const password = 'secure_password_123';

  // Create organization
  const [org] = await db.insert(organizations).values({
    name: 'Palm Exotic Rentals',
    subdomain,
    status: 'active',
  }).returning();

  // Create admin user
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    email,
    passwordHash,
    name: 'Palm Admin',
    organizationId: org.id,
    role: 'admin',
  });

  console.log(`✓ Created ${org.name} (subdomain: ${subdomain})`);
  console.log(`✓ Login: ${email} / ${password}`);
}

addClient();
```

Run with:
```bash
tsx scripts/add-client.ts
```

## Updating API Credentials

### Using Encryption Utility

```typescript
import { encryptApiKey, decryptApiKey } from '../lib/db/encryption';
import { db } from '../lib/db';
import { organizations } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

// Encrypt and store
const calendlyToken = 'your_calendly_access_token';
const encrypted = encryptApiKey(calendlyToken);

await db.update(organizations)
  .set({ calendlyAccessToken: encrypted })
  .where(eq(organizations.subdomain, 'palm'));

// Retrieve and decrypt
const org = await db.query.organizations.findFirst({
  where: eq(organizations.subdomain, 'palm'),
});

if (org?.calendlyAccessToken) {
  const decrypted = decryptApiKey(org.calendlyAccessToken);
  console.log('Calendly Token:', decrypted);
}
```

### Using Drizzle Studio

1. Run `npm run db:studio`
2. Select organization
3. **Important**: You must encrypt the API key first using the encryption utility
4. Paste the encrypted value into the appropriate field

**Never store plain-text API keys in the database!**

## Backup & Restore

### Backup Database

```bash
# Full backup
pg_dump marketing_dashboard > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump --schema-only marketing_dashboard > schema.sql

# Data only
pg_dump --data-only marketing_dashboard > data.sql
```

### Restore Database

```bash
psql marketing_dashboard < backup_20231127.sql
```

## Production Deployment

### Vercel + Neon/Supabase/Railway

1. Create PostgreSQL database on your provider
2. Get connection string
3. Add to Vercel environment variables:
   ```
   DATABASE_URL=postgresql://...
   ENCRYPTION_KEY=your_64_char_hex_key
   ```
4. Deploy application
5. Run migrations:
   ```bash
   npm run db:push
   ```

### Security Checklist

- ✅ Use SSL for database connections (`?sslmode=require`)
- ✅ Strong passwords for database users
- ✅ Rotate ENCRYPTION_KEY regularly
- ✅ Never commit `.env.local` to Git
- ✅ Use environment variables in production
- ✅ Backup database regularly
- ✅ Monitor api_logs table for suspicious activity

## Troubleshooting

### Connection refused

```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Check port
psql -h localhost -p 5432 -U postgres
```

### Migration errors

```bash
# Reset database (⚠️ deletes all data)
psql postgres -c "DROP DATABASE marketing_dashboard;"
psql postgres -c "CREATE DATABASE marketing_dashboard;"
npm run db:push
npm run db:seed
```

### Encryption key errors

```bash
# Generate new key
openssl rand -hex 32

# Update .env.local with new key
# Re-encrypt all existing API credentials
```

## Support

For issues or questions:
1. Check logs: `npm run db:studio`
2. Verify `.env.local` configuration
3. Test database connection: `psql $DATABASE_URL`

---

**Next Steps:**
- Implement authentication middleware to check subdomain
- Create API routes that filter by organization_id
- Build admin panel for managing clients
- Set up automated backups
