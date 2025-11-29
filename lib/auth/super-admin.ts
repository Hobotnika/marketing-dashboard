import { auth } from '@/auth';

// Super admin emails - only these can access admin panel
const SUPER_ADMIN_EMAILS = [
  'ricardo@example.com', // Replace with your actual super admin email
  'admin@system.com',
  'admin@demo.com', // Demo super admin for testing
];

/**
 * Check if the current user is a super admin
 * @returns true if user is super admin, false otherwise
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth();

  if (!session || !session.user) {
    return false;
  }

  return SUPER_ADMIN_EMAILS.includes(session.user.email);
}

/**
 * Check if an email is a super admin
 * @param email - Email to check
 * @returns true if email is super admin, false otherwise
 */
export function isSuperAdminEmail(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email);
}

/**
 * Get super admin emails list
 * @returns Array of super admin emails
 */
export function getSuperAdminEmails(): string[] {
  return [...SUPER_ADMIN_EMAILS];
}
