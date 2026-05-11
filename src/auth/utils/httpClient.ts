import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import Session from 'supertokens-auth-react/recipe/session';
import { EmailVerificationClaim } from 'supertokens-auth-react/recipe/emailverification';
import { mapAxiosError, createEmailUnverifiedError } from './httpErrors';
import { AuthConfig } from '../types';

// Create an Axios instance with default configuration
export const createHttpClient = (
  baseURL: string,
  authConfig: AuthConfig,
  getOrgId?: () => string | undefined
): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Additional request interceptor for org-id header + Bearer token
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      config.headers['st-auth-mode'] = 'header';

      // Add Bearer token from SuperTokens session — same auth as socket connection
      try {
        const accessToken = await Session.getAccessToken();
        if (accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
      } catch {
        // Session not available yet — let request proceed (may fail with 401)
      }

      // Dynamically add org-id header from current context
      const currentOrgId = getOrgId?.() || import.meta.env.VITE_DEV_ORG_ID;

      // For API calls that require org-id, block if it's not available
      // Skip this check for auth endpoints that don't need org-id
      const isAuthEndpoint =
        config.url?.includes('/auth') ||
        config.url?.includes('/auth_check') ||
        config.url?.includes('/login') ||
        config.url?.includes('/logout') ||
        config.url?.includes('/member/organizations'); // For non-dock

      if (!isAuthEndpoint && !currentOrgId) {
        console.warn(
          'Blocking API call - org-id not available yet:',
          config.url
        );
        return Promise.reject(
          new Error(
            'Organization ID not available. Please wait for authentication to complete.'
          )
        );
      }

      if (currentOrgId) {
        config.headers['org-id'] = currentOrgId;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh and auth errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const standardError = mapAxiosError(error);

      // Handle 403 Forbidden errors - only redirect if we have an active session
      if (standardError.status === 403 && !import.meta.env.VITE_DEV_ORG_ID) {
        console.error('403 Forbidden error:', standardError);
        try {
          const claimValidationErrors = await Session.validateClaims();
          const errorsArray = Array.isArray(claimValidationErrors)
            ? claimValidationErrors
            : [claimValidationErrors];
          const emailUnverified = errorsArray.some(
            (e) => e.id === EmailVerificationClaim.id
          );
          if (emailUnverified) {
            window.location.href =
              (authConfig.appInfo.websiteBasePath ?? '') + '/send-verification-email';
            return Promise.reject(createEmailUnverifiedError(error));
          } else {
            await Session.signOut();
            window.location.href =
              (authConfig.appInfo.websiteBasePath ?? '') + '/login-error';
          }
        } catch (claimError) {
          console.error('Error validating claims:', claimError);
        }
      }

      // For any other errors, return the standardized error
      return Promise.reject(standardError);
    }
  );

  return instance;
};
