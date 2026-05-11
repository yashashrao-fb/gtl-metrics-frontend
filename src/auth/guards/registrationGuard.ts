import { redirect } from '@tanstack/react-router';
import Session from 'supertokens-auth-react/recipe/session';
import { GuardFunction } from './types';
import { HttpErrorType } from '../utils/httpErrors';

/**
 * Registration flow guard - Manages the registration flow
 * Uses methods from AuthProvider
 * @param context The guard context with auth and http
 * @param isRegistrationPage Whether the current page is a registration page
 */
// Use a named function to improve debugging output
export const requireRegistration: GuardFunction =
  async function requireRegistration(
    { logout, httpClient },
    isRegistrationPage = false
  ) {
    try {
      // First ensure the user is authenticated
      const sessionExists = await Session.doesSessionExist();
      if (!sessionExists) {
        await logout();
        throw redirect({ to: '/login' });
      }

      // Get user profile
      let userProfile;
      try {
        if (!httpClient) {
          throw new Error('HTTP client not available in guard context');
        }

        userProfile = await httpClient.get('/v2/user/profile');
      } catch (error: any) {
        console.warn('Error fetching user profile:', error);

        // Handle email verification error
        if (
          error?.type === HttpErrorType.EMAIL_UNVERIFIED ||
          error?.code === 'EMAIL_UNVERIFIED'
        ) {
          // The HTTP client already redirected, just prevent access
          throw redirect({ to: '/send-verification-email' });
        }

        await logout();
        throw redirect({ to: '/login' });
      }

      // If userProfile is null, assume the user is unauthorized
      if (!userProfile) {
        console.warn('No user profile found => logging out');
        await logout();
        throw redirect({ to: '/login' });
      }

      // Check registration state based on viewPolicyPage
      const viewPolicyPage = userProfile?.data?.data?.view_policy_page ?? true;
      // Case 1: User needs to complete registration but trying to access other pages
      if (
        (viewPolicyPage === true || viewPolicyPage === undefined) &&
        !isRegistrationPage
      ) {
        throw redirect({ to: '/user-registration' });
      }

      // Case 2: User completed registration but trying to access registration page
      if (viewPolicyPage === false && isRegistrationPage) {
        throw redirect({ to: '/' });
      }
    } catch (error: any) {
      console.error('Registration guard error:', error);

      if (error.isRedirect) {
        throw error;
      }

      throw redirect({ to: '/login' });
    }
  };
