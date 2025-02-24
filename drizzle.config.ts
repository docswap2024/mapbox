import type { Config } from 'drizzle-kit';

import { config } from 'dotenv';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing');
}

config({ path: '.env' });

export default {
  schema: './src/db/schema/**.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;
