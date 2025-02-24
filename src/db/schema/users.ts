import { createId } from '@paralleldrive/cuid2';
import { text, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { WebsiteOwner, websiteOwners } from './websiteOwners';
import { sessions } from './sessions';
import { Offer , offers} from './offers';
import {Review, reviews} from './reviews';

export const users = pgTable('user', {
  id: varchar('id', { length: 255 })
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  apiKey: text('api_key')
          .notNull()
          .references(() => websiteOwners.apiKey, { onUpdate: 'cascade', onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  websiteOwners: one(websiteOwners, {
    fields: [users.apiKey],
    references: [websiteOwners.apiKey],
    relationName: 'websiteOwners'
  }),
  offers: many(offers),
  reviews: many(reviews)
}));


export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type CompleteUser = typeof users.$inferSelect & {
   websiteOwners: WebsiteOwner;
   offers: Offer[] | null;
   reviews: Review[] | null;
};
