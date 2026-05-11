// Export types
export * from './types';

// Export provider and authentication components
export { AuthProvider } from './providers/AuthProvider';
export { default as LoginPage } from './components/LoginPage';
export { default as LinkSentPage } from './components/LinkSentPage';
export { default as PasswordlessVerification } from './components/PasswordlessVerification';
export { default as ThirdPartyAuth } from './components/ThirdPartyAuth';
export { default as ThirdPartyAuthCallback } from './components/ThirdPartyAuthCallback';
export { default as RestrictedPage } from './components/RestrictedPage';
export { default as OrgNotFoundPage } from './components/OrgNotAccessiblePage';
export { default as LoginErrorPage } from './components/LoginErrorPage';
export { default as LogoutPage } from './components/LogoutPage';
export { default as NoSitesAvailablePage } from './components/NoSitesAvailablePage';
export { default as LoginWrapper } from './components/LoginWrapper';
export { default as OnPremLogin } from './components/OnPremLogin';
export { default as Signup } from './components/Signup';

// Export user registration components
export { default as UserRegistration } from './components/user-registration/UserRegistration';
export { default as Welcome } from './components/user-registration/Welcome';
export { default as Terms } from './components/user-registration/Terms';
export { default as AdditionalInfo } from './components/user-registration/AdditionalInfo';
export { default as OrgCheckGate } from './components/OrgCheckGate';

// Export utilities
export {
  initializeSuperTokens,
  redirectToThirdPartyLogin,
  generateOriginToken,
  decodeOriginToken,
  getDomainName,
  setAuthConfig,
  getAuthConfig,
  getSuperTokensConfig,
} from './config/SuperTokensConfig';

// Export HTTP utilities
export { createHttpClient } from './utils/httpClient';
export { HttpProvider } from './providers/HttpProvider';
export { useHttp } from './hooks/useHttp';
export {
  HttpErrorType,
  mapAxiosError,
  createEmailUnverifiedError,
  type HttpErrorDetails,
} from './utils/httpErrors';

// Export route guard utilities
export {
  combineGuards,
  createRouteLoader,
  createGuard,
  requireAuth,
  requireSuperAdmin,
  requireOrg,
  requireRegistration,
  combineGuardFunctions,
  createLayoutGuardLoader,
  // Site access guard
  createSiteAccessGuard,
} from './guards';
export { requireFeature } from './guards/featureGuard';

export type {
  GuardContext,
  RouteLoaderContext,
  SiteAccessGuardConfig,
} from './guards';

// Export hooks
export { useAuth } from './hooks/useAuth';

// Export iframe storage handlers for SuperTokens
export {
  getWindowHandler,
  getCookieHandler,
  shouldUseCustomHandlers,
} from './utils/iframe-storage-handlers';
