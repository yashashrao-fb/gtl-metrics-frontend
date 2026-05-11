import { redirect } from '@tanstack/react-router';
import Session from 'supertokens-auth-react/recipe/session';
import { GuardFunction } from './types';

/**
 * Auth guard - Checks if the user is authenticated
 * Uses Session.doesSessionExist() for cookie-based authentication
 */
export const requireAuth: GuardFunction = async ({ logout }) => {
  try {
    const sessionExists = await Session.doesSessionExist();
    if (!sessionExists) {
      await logout();
      throw redirect({ to: '/login' });
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    throw redirect({ to: '/login' });
  }
};
