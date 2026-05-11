import SuperTokens from 'supertokens-auth-react';
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword';
import Passwordless from 'supertokens-auth-react/recipe/passwordless';
import Session from 'supertokens-auth-react/recipe/session';
import ThirdParty from 'supertokens-auth-react/recipe/thirdparty';
import Multitenancy from 'supertokens-auth-react/recipe/multitenancy';
import EmailVerification from 'supertokens-auth-react/recipe/emailverification';
import {
  AuthConfig,
  THIRD_PARTY_IDS,
  AUTH_DEFAULTS,
  STORAGE_KEYS,
  ST_TOKEN_TRANSFER_METHOD,
} from '../types';
import {
  getWindowHandler,
  getCookieHandler,
  shouldUseCustomHandlers,
} from '../utils/iframe-storage-handlers';

// Global configuration that can be set by the app
let authConfig: AuthConfig = {
  appInfo: {
    apiDomain: AUTH_DEFAULTS.API_DOMAIN,
    websiteDomain: AUTH_DEFAULTS.WEBSITE_DOMAIN,
    apiBasePath: AUTH_DEFAULTS.API_BASE_PATH,
    websiteBasePath: AUTH_DEFAULTS.WEBSITE_BASE_PATH,
    appName: AUTH_DEFAULTS.APP_NAME,
    loginAppUrl: AUTH_DEFAULTS.LOGIN_APP_URL,
  },
};

// Utility function to generate an origin token
export function generateOriginToken(origin: string): string {
  const randomString = window.crypto
    .getRandomValues(new Uint8Array(16))
    .join('');
  return btoa(JSON.stringify({ origin, randomString }));
}

// Utility function to decode an origin token
export function decodeOriginToken(encodedState: string): {
  origin: string;
  randomString: string;
} {
  const decodedString = atob(encodedState);
  return JSON.parse(decodedString);
}

// Utility function to get domain name
export function getDomainName(hostName: string): string {
  // Handle localhost explicitly
  if (hostName === 'localhost' || hostName === '127.0.0.1') {
    return '.localhost';
  }
  
  // Handle lovable domains
  if (hostName.includes('.lovable.app')) {
    return '.lovable.app';
  }
  if (hostName.includes('.lovableproject.com')) {
    return '.lovableproject.com';
  }
  
  // For other domains, extract the root domain
  return (
    '.' +
    hostName.substring(
      hostName.lastIndexOf('.', hostName.lastIndexOf('.') - 1) + 1
    )
  );
}

// Function to set auth configuration from the app
export const setAuthConfig = (config: Partial<AuthConfig>) => {
  authConfig = {
    ...authConfig,
    ...config,
    appInfo: {
      ...authConfig.appInfo,
      ...(config.appInfo || {}),
    },
  };
};

// Function to get the current auth configuration
export const getAuthConfig = (): AuthConfig => {
  return authConfig;
};

// Function to get the SuperTokens configuration with current settings
export function getSuperTokensConfig() {
  const domain = getDomainName(window.location.hostname);
  const useCustomHandlers = shouldUseCustomHandlers();
  
  // Check if we're in an iframe context
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();

  console.log('[SuperTokens] Configuration:', {
    domain,
    isInIframe,
    useCustomHandlers,
    tokenMethod: ['.localhost', '.lovable.app', '.lovableproject.com'].includes(domain)
      ? 'header'
      : 'cookie',
  });

  return {
    appInfo: {
      appName: authConfig.appInfo.appName || AUTH_DEFAULTS.APP_NAME,
      apiDomain: authConfig.appInfo.apiDomain || AUTH_DEFAULTS.API_DOMAIN,
      websiteDomain:
        authConfig.appInfo.websiteDomain || AUTH_DEFAULTS.WEBSITE_DOMAIN,
      apiBasePath:
        authConfig.appInfo.apiBasePath || AUTH_DEFAULTS.API_BASE_PATH,
      websiteBasePath:
        authConfig.appInfo.websiteBasePath || AUTH_DEFAULTS.WEBSITE_BASE_PATH,
    },
    // Use custom handlers when in iframe or storage is blocked
    ...(useCustomHandlers && {
      windowHandler: getWindowHandler,
      cookieHandler: getCookieHandler,
    }),
    recipeList: [
      EmailPassword.init(),
      EmailVerification.init(),
      Passwordless.init({
        contactMethod: 'EMAIL',
      }),
      ThirdParty.init({
        signInAndUpFeature: {
          // Using the built-in Google provider to satisfy SuperTokens requirements
          providers: [
            {
              id: 'google',
              name: 'Google',
            },
          ],
        },
      }),
      Session.init({
        sessionExpiredStatusCode: 401,
        // Enable iframe mode when in iframe context
        isInIframe,
        // Don't set sessionTokenFrontendDomain for header mode - it's only for cookies!
        // Setting it causes SuperTokens to try cookie operations even in header mode
        tokenTransferMethod:
          ['.localhost', '.lovable.app', '.lovableproject.com'].includes(domain)
            ? ST_TOKEN_TRANSFER_METHOD.HEADER
            : ST_TOKEN_TRANSFER_METHOD.COOKIE,
        // Only set sessionTokenFrontendDomain if using cookie mode
        ...(!['.localhost', '.lovable.app', '.lovableproject.com'].includes(domain) && {
          sessionTokenFrontendDomain: domain
        }),
        onHandleEvent: async (context) => {
          if (context.action === 'SIGN_OUT') {
            window.location.href =
              authConfig.appInfo.websiteDomain +
              (authConfig.appInfo.websiteBasePath ?? '') +
              '/login';
          }
          console.log('[ST Event]', context.action);
        },
      }),
      Multitenancy.init({
        override: {
          functions: (oI) => {
            return {
              ...oI,
              getTenantId: async () => {
                // Get the tenantId from the auth config
                return getAuthConfig().appInfo.tenantId;
              },
            };
          },
        },
      }),
    ],
  };
}
// Function to redirect to third-party login
export async function redirectToThirdPartyLogin(
  thirdPartyId: THIRD_PARTY_IDS
): Promise<void> {
  const origin =
    window.location.origin + (authConfig.appInfo.websiteBasePath || '');

  // We're using the login app approach for all environments to keep it consistent
  const originToken = generateOriginToken(origin);

  // Store the origin in session storage for when the user is redirected back
  sessionStorage.setItem(STORAGE_KEYS.SESSION_ORIGIN, origin);

  // Get the login app URL from the configuration or use the default
  const loginAppUrl =
    authConfig.appInfo.loginAppUrl || AUTH_DEFAULTS.LOGIN_APP_URL;

  // Redirect to the login app with the encoded origin and third-party ID
  window.location.href = `${loginAppUrl}/accounts/login?origin=${encodeURIComponent(
    originToken
  )}&thirdpartyId=${encodeURIComponent(thirdPartyId)}`;
}

// Keep track of whether SuperTokens has been initialized
let initialized = false;

// Helper function to initialize SuperTokens instance
// Should be called before using any SuperTokens functionality
export function initializeSuperTokens(config?: Partial<AuthConfig>): void {
  if (typeof window !== 'undefined' && !initialized) {
    // Update the global config if provided
    if (config) {
      setAuthConfig(config);
    }

    // Get the current config
    const superTokensConfig = getSuperTokensConfig();

    // Initialize SuperTokens
    SuperTokens.init(superTokensConfig);
    initialized = true;
  }
}
