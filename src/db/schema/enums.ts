import { pgEnum } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const userStatusEnum = pgEnum('user_status', ['Active', 'Inactive']);
export const UserStatus = z.enum(userStatusEnum.enumValues).Enum;
