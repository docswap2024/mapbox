import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const websiteOwners = pgTable('websiteOwner', {
  apiKey: varchar('apiKey', { length: 255 })
    .primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  domain: varchar('domain', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull(),
});

export const websiteOwnersRelations = relations(websiteOwners, ({ one, many }) => ({
  users: many(users),
}));


export type NewWebsiteOwner = typeof websiteOwners.$inferInsert;
export type WebsiteOwner = typeof websiteOwners.$inferSelect;