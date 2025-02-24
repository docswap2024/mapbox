import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { websiteOwnerSeeder } from './seeds/websiteOwner';

dotenv.config();

if (!('DATABASE_URL' in process.env))
  throw new Error('DATABASE_URL not found on .env');

const main = async () => {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(client);
  console.log('🌱 SEEDING STARTED\n');

  try {
    console.log('🚀 Inserting permissions\n');
    await websiteOwnerSeeder(db);
  } catch (error) {
    console.log(error);
    console.log('❌ Seeding Failed');  
  }

  console.log('✅ SEEDING COMPLETED\n');
};

main().finally(() => process.exit(0));
