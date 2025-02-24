import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const offers = pgTable('offer', {
  id: varchar('id', { length: 255 })
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }), // Assuming phone numbers are strings
  purchasePrice: varchar('purchase_price').notNull(),
  depositAmount: varchar('deposit_amount').notNull(),
  message: varchar('message'), // Assuming comments can be long text
  pid: varchar('pid', { length: 255 }), // Assuming pid is a string
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const offersRelations = relations(offers, ({ one, many }) => ({
  users: one(users, {
    fields: [offers.userId],
    references: [users.id],
    relationName: 'user',
  })
}));


export type NewOffer = typeof offers.$inferInsert;
export type Offer = typeof offers.$inferSelect;
