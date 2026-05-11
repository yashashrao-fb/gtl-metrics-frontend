import { redirect, isRedirect } from '@tanstack/react-router';
import Session from 'supertokens-auth-react/recipe/session';
import { GuardFunction } from './types';
import { OrgCheckState } from '../types';
import { HttpErrorType } from '../utils/httpErrors';

/**
 * Organization guard - Checks if the user has a valid organization
 * Uses methods from AuthProvider
 */
export const requireOrg: GuardFunction = async ({
  checkCurrentOrgInMap,
  logout,
}) => {
  try {
    // First ensure the user is authenticated
    const sessionExists = await Session.doesSessionExist();
    if (!sessionExists) {
      await logout();
      throw redirect({ to: '/login' });
    }

    // Check organization status
    const orgStatus = await checkCurrentOrgInMap();

    // Wait for React state update to propagate to refs
    // This ensures authRef.current.orgId is updated before subsequent guards run
    // Yields to event loop, allowing AuthProvider and HttpProvider to process state updates
    await new Promise((resolve) => setTimeout(resolve, 10));

    if (orgStatus === OrgCheckState.EMPTY_ORGANIZATION_MAP) {
      throw redirect({ to: '/welcome' });
    }

    if (orgStatus === OrgCheckState.ORGANIZATION_NOT_FOUND) {
      throw redirect({ to: '/org-not-accessible' });
    }
  } catch (error: any) {
    console.error('Organization check failed:', error);

    // Use TanStack Router's isRedirect function to properly detect redirect Response objects
    if (isRedirect(error)) {
      throw error;
    }

    // Handle email verification error
    if (
      error?.type === HttpErrorType.EMAIL_UNVERIFIED ||
      error?.code === 'EMAIL_UNVERIFIED'
    ) {
      // The HTTP client already redirected, just prevent access
      throw redirect({ to: '/send-verification-email' });
    }

    throw redirect({ to: '/login' });
  }
};
