import { redirect } from '@tanstack/react-router';
import Session from 'supertokens-auth-react/recipe/session';
import { GuardFunction } from './types';

/**
 * SuperAdmin guard - Checks if the user is a super admin
 * Uses the isUserASuperAdmin method from AuthProvider
 */
export const requireSuperAdmin: GuardFunction = async ({
  isUserASuperAdmin,
  logout,
}) => {
  try {
    // First ensure the user is authenticated (like Angular composite guards)
    const sessionExists = await Session.doesSessionExist();
    if (!sessionExists) {
      await logout();
      throw redirect({ to: '/login' });
    }

    // Check super admin status
    const isUserAdmin = await isUserASuperAdmin();
    if (!isUserAdmin) {
      throw redirect({ to: '/restricted' });
    }
  } catch (error) {
    console.error('Super admin check failed:', error);
    // If it's an auth error, it will be handled by the auth guard
    // Otherwise redirect to restricted
    throw redirect({ to: '/restricted' });
  }
};
