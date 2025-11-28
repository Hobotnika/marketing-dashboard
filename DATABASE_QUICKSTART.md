# Database Quick Start Guide

Quick reference for setting up and managing the multi-tenant database.

## 🚀 Quick Setup (5 minutes)

### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql@16 && brew services start postgresql@16

# Ubuntu
sudo apt install postgresql && sudo systemctl start postgresql
```

### 2. Create Database

```bash
psql postgres -c "CREATE DATABASE marketing_dashboard;"
```

### 3. Generate Encryption Key

```bash
openssl rand -hex 32
```

### 4. Update .env.local

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/marketing_dashboard
ENCRYPTION_KEY=paste_generated_key_here
```

### 5. Push Schema & Seed

```bash
npm run db:push
npm run db:seed
```

**Done! 🎉**

Login: `admin@demo.com` / `demo123`

## 📋 Common Commands

```bash
# Database management
npm run db:push          # Push schema to database
npm run db:studio        # Open GUI (http://localhost:4983)
npm run db:seed          # Seed demo data

# Client management
npm run db:add-client    # Interactive: add new client
```

## 🏢 Add New Client (3 ways)

### Option 1: Interactive Script (Easiest)

```bash
npm run db:add-client
```

### Option 2: GUI (Drizzle Studio)

```bash
npm run db:studio
# Open http://localhost:4983
# Add to organizations → Add to users
```

### Option 3: TypeScript

```typescript
import { db } from './lib/db';
import { organizations, users } from './lib/db/schema';
import { encryptApiKey } from './lib/db/encryption';
import bcrypt from 'bcryptjs';

// Create org
const [org] = await db.insert(organizations).values({
  name: 'Palm Exotic Rentals',
  subdomain: 'palm',
  status: 'active',
  stripeSecretKey: encryptApiKey('sk_live_...'),
}).returning();

// Create user
await db.insert(users).values({
  email: 'admin@palm.com',
  passwordHash: await bcrypt.hash('password123', 10),
  name: 'Admin',
  organizationId: org.id,
  role: 'admin',
});
```

## 🔒 Encrypt/Decrypt API Keys

```typescript
import { encryptApiKey, decryptApiKey } from './lib/db/encryption';

// Encrypt before storing
const encrypted = encryptApiKey('your_api_key_here');

// Decrypt when using
const original = decryptApiKey(encrypted);
```

## 📊 Database Schema

### organizations
- Stores client info, subdomain, encrypted API keys
- Status: trial, active, inactive

### users
- Login credentials, linked to organization
- Role: admin, viewer

### api_logs
- Audit trail for all API calls
- Success/error tracking

## 🔧 Troubleshooting

**Connection refused?**
```bash
brew services list  # Check PostgreSQL is running
psql postgres       # Test connection
```

**Migration errors?**
```bash
npm run db:push     # Force push schema
```

**Forgot password?**
```bash
npm run db:studio   # Reset via GUI
```

## 📚 Full Documentation

See `DATABASE_SETUP.md` for complete details.

## 🌐 Production (Vercel)

1. Create PostgreSQL database (Neon/Supabase/Railway)
2. Add to Vercel env vars:
   - `DATABASE_URL`
   - `ENCRYPTION_KEY`
3. Deploy
4. Run: `npm run db:push`

---

**Need help?** Check `DATABASE_SETUP.md`
