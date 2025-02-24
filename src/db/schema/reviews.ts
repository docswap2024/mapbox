import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const reviews = pgTable('review', {
  id: varchar('id', { length: 255 })
    .$defaultFn(() => createId())
    .primaryKey(),
  estimateValue: varchar('estimate_value').notNull(),
  landscaping: numeric('landscaping').notNull(),
  location: numeric('location').notNull(),
  view: numeric('view').notNull(),
  curbAppeal: numeric('curb_appeal').notNull(),
  address: varchar('address').notNull(),
  comments: varchar('comments'), // Assuming comments can be long text
  pid: varchar('pid', { length: 255 }), // Assuming pid is a string
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  users: one(users, {
    fields: [reviews.userId],
    references: [users.id],
    relationName: 'user',
  })
}));

export type NewReview = typeof reviews.$inferInsert;
export type Review = typeof reviews.$inferSelect;
