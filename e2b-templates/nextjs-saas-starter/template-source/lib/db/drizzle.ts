import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Gracefully handle missing POSTGRES_URL
// App will load but database operations will fail with helpful errors
const POSTGRES_URL = process.env.POSTGRES_URL || '';

if (!POSTGRES_URL) {
  console.warn(
    '⚠️  POSTGRES_URL not configured. Database features will not work. ' +
    'Add POSTGRES_URL to your .env file to enable database functionality.'
  );
}

export const client = POSTGRES_URL ? postgres(POSTGRES_URL) : null as any;
export const db = POSTGRES_URL ? drizzle(client, { schema }) : null as any;
