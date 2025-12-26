import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
}

// Extract the file path from the DATABASE_URL (remove 'file:' prefix if present)
const dbPath = process.env.DATABASE_URL.replace(/^file:/, '');

// Create a SQLite connection
const sqlite = new Database(dbPath);

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export schema for easy access
export * from './schema';
