'use server';

import { AuthService } from '@/db/server/service/auth.service';

export const signUp = async (email: string, password: string, name: string, apiKey: string) => {
  return AuthService.signUp(email, password, name, apiKey);
};

export const logIn = async (email: string, password: string) => {
  return AuthService.logIn(email, password);
};

export const logOut = async () => {
  return AuthService.logOut();
};
