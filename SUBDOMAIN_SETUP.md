# Subdomain Configuration Guide

This guide explains how to configure and test the multi-tenant subdomain system.

## Overview

The application uses subdomains to route users to different parts of the system:
- **Main domain** (no subdomain or www) → Landing page
- **admin subdomain** → Admin panel
- **Client subdomains** → Client dashboards

## Local Development

### Testing Subdomains on Localhost

To test subdomains locally, you need to configure your `/etc/hosts` file.

#### macOS/Linux

1. Edit your hosts file:
```bash
sudo nano /etc/hosts
```

2. Add these lines:
```
127.0.0.1 localhost
127.0.0.1 demo.localhost
127.0.0.1 admin.localhost
127.0.0.1 palm.localhost
```

3. Save and exit (Ctrl+X, then Y, then Enter)

4. Test in browser:
- http://localhost:3000 → Landing page
- http://demo.localhost:3000 → Demo client dashboard
- http://admin.localhost:3000 → Admin panel

#### Windows

1. Run Notepad as Administrator

2. Open: `C:\Windows\System32\drivers\etc\hosts`

3. Add these lines:
```
127.0.0.1 localhost
127.0.0.1 demo.localhost
127.0.0.1 admin.localhost
```

4. Save the file

5. Flush DNS cache:
```cmd
ipconfig /flushdns
```

## Routing Logic

### Main Domain (no subdomain or www)
- **URL**: http://yourdomain.com or http://www.yourdomain.com
- **Route**: `app/(main)/page.tsx`
- **Content**: Landing page with features, CTA to sign in
- **Authentication**: Not required

### Admin Subdomain
- **URL**: http://admin.yourdomain.com
- **Route**: `app/(admin)/admin/page.tsx`
- **Content**: Admin panel to manage all organizations
- **Authentication**: Required
- **Access**: Only admins can view

### Client Subdomains
- **URL**: http://{subdomain}.yourdomain.com
- **Route**: `app/(tenant)/dashboard/page.tsx`
- **Content**: Client-specific marketing dashboard
- **Authentication**: Required
- **Validation**:
  - Checks if organization with subdomain exists in database
  - Verifies user belongs to that organization
  - Shows 404 if organization not found
  - Shows 403 if user tries to access wrong organization

## Middleware Flow

```
Request comes in
    ↓
Extract subdomain from host
    ↓
Is subdomain empty/www?
    ├─ YES → Landing page
    │
    ├─ NO → Is subdomain "admin"?
    │   ├─ YES → Check auth → Admin panel
    │   │
    │   └─ NO → Check if org exists in DB
    │       ├─ NOT FOUND → 404 page
    │       │
    │       └─ FOUND → Check auth → Verify user.org == subdomain.org
    │           ├─ MISMATCH → 403 page
    │           │
    │           └─ MATCH → Client dashboard
```

## Production Deployment

### DNS Configuration

#### Wildcard DNS (Recommended)

Configure a wildcard DNS record to point all subdomains to your server:

```
Type: A
Name: *
Value: Your_Server_IP
TTL: 3600
```

This allows any subdomain (demo.yourdomain.com, palm.yourdomain.com, etc.) to work automatically.

#### Individual Subdomains (Alternative)

If wildcard DNS is not available, add each subdomain individually:

```
Type: A
Name: admin
Value: Your_Server_IP

Type: A
Name: demo
Value: Your_Server_IP

Type: A
Name: palm
Value: Your_Server_IP
```

### Vercel Configuration

1. Add your custom domain in Vercel dashboard
2. Vercel automatically supports wildcards
3. Add environment variables:
   - `DATABASE_URL`
   - `ENCRYPTION_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL=https://yourdomain.com`

4. Deploy!

### Railway/Heroku

1. Add custom domain
2. Configure wildcard subdomain support (varies by platform)
3. Set environment variables
4. Deploy

## Testing Checklist

### Main Domain
- [ ] http://localhost:3000 → Shows landing page
- [ ] http://www.localhost:3000 → Shows landing page (if configured in hosts)
- [ ] Clicking "Sign In" → Redirects to /login

### Admin Panel
- [ ] http://admin.localhost:3000 → Redirects to /login if not authenticated
- [ ] After login → Shows admin panel
- [ ] Admin panel lists all organizations
- [ ] Admin panel shows all users

### Client Dashboard
- [ ] http://demo.localhost:3000 → Redirects to /login
- [ ] Login with admin@demo.com / demo123
- [ ] After login → Shows marketing dashboard
- [ ] User menu shows "Demo Admin" and "Demo Client"
- [ ] Role badge shows "admin"

### 404 - Unknown Subdomain
- [ ] http://unknown.localhost:3000 → Shows 404 "Organization Not Found"
- [ ] Error page is styled (dark theme)
- [ ] "Go to Homepage" button works

### 403 - Wrong Organization
1. Login to demo.localhost:3000 with demo credentials
2. Try to access palm.localhost:3000
3. Should show 403 "Access Denied"
4. Error message shows which orgs are involved

## Adding New Clients

### Option 1: CLI (Recommended)
```bash
npm run db:add-client
```
Follow the prompts to add organization and user.

### Option 2: Drizzle Studio
```bash
npm run db:studio
```
Manually add organization and user through GUI.

### Option 3: SQL
```sql
-- Add organization
INSERT INTO organizations (name, subdomain, status)
VALUES ('Palm Exotic Rentals', 'palm', 'active');

-- Add user (get org ID from above)
INSERT INTO users (email, password_hash, name, organization_id, role)
VALUES (
  'admin@palm.com',
  'bcrypt_hash_here',
  'Palm Admin',
  'org_id_here',
  'admin'
);
```

Generate password hash:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(console.log)"
```

## Troubleshooting

### Subdomains not working locally

**Issue**: demo.localhost:3000 shows main landing page instead of login

**Solution**:
1. Check `/etc/hosts` file has correct entries
2. Clear browser cache
3. Try in incognito/private window
4. Restart Next.js dev server

### Middleware not detecting subdomain

**Issue**: Console shows "Subdomain: none" even with demo.localhost

**Solution**:
1. Check middleware logs in terminal
2. Verify `getSubdomain()` function logic
3. Test with: `curl -H "Host: demo.localhost:3000" http://localhost:3000`

### Organization not found error

**Issue**: Valid subdomain shows 404

**Solution**:
1. Check database has organization with matching subdomain
2. Run: `npm run db:studio` to verify data
3. Check case sensitivity (subdomain should be lowercase)

### CORS errors with API

**Issue**: API calls fail with CORS errors

**Solution**:
1. Ensure all subdomains use same protocol (http or https)
2. Check NextAuth configuration has correct NEXTAUTH_URL
3. Verify middleware adds correct headers

## Security Considerations

1. **SSL/TLS**: Always use HTTPS in production
2. **Wildcard Certificates**: Get a wildcard SSL cert (`*.yourdomain.com`)
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Input Validation**: Middleware validates subdomain format
5. **SQL Injection**: Using Drizzle ORM with parameterized queries
6. **XSS Prevention**: Next.js auto-escapes output
7. **CSRF Protection**: NextAuth handles CSRF tokens

## Next Steps

1. Configure DNS with wildcard support
2. Get wildcard SSL certificate
3. Deploy to production
4. Add rate limiting middleware
5. Set up monitoring/logging
6. Create onboarding flow for new clients

---

**Need help?** Check the main README or open an issue on GitHub.
