import { redirect } from 'next/navigation';
import { User } from 'lucia';

import { validateRequest } from './auth';

export const getCurrentUser = async (): Promise<User|null> => {
  const { user } = await validateRequest();

  if (!user) return null;
  return user;
};