// Shared types for auth library

/**
 * Organization check state enumeration
 */
export enum OrgCheckState {
  ORGANIZATION_FOUND = 'org_found',
  ORGANIZATION_NOT_FOUND = 'org_not_found',
  EMPTY_ORGANIZATION_MAP = 'empty_org_map',
}

/**
 * User types enumeration
 */
export enum USER_TYPE {
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER = 'USER',
}

/**
 * Third party authentication providers
 */
export enum THIRD_PARTY_IDS {
  GOOGLE = 'google',
  MICROSOFT = 'active-directory',
}

export enum ST_TOKEN_TRANSFER_METHOD {
  HEADER = 'header',
  COOKIE = 'cookie',
}

/**
 * Default configuration values
 */
export enum AUTH_DEFAULTS {
  API_DOMAIN = 'http://localhost:4004',
  WEBSITE_DOMAIN = 'http://localhost:4000',
  LOGIN_APP_URL = 'http://localhost:4006',
  API_BASE_PATH = '/auth',
  WEBSITE_BASE_PATH = '/',
  APP_NAME = 'Operations',
  HTTP_BASE_URL = '',
}

/**
 * Storage keys
 */
export enum STORAGE_KEYS {
  SESSION_ORIGIN = 'fb-redirect-origin',
  PASSWORDLESS_EMAIL = 'passwordless_email',
  PASSWORDLESS_DEVICE_ID = 'passwordless_deviceId',
}

/**
 * Session storage key for redirection origin
 * @deprecated Use STORAGE_KEYS.SESSION_ORIGIN instead
 */
export const SESSION_ORIGIN_KEY = STORAGE_KEYS.SESSION_ORIGIN;

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  appInfo: {
    appName?: string;
    apiDomain: string;
    tunnelDomain?: string;  // Optional tunnel domain for socket/streaming (overrides apiDomain)
    websiteDomain: string;
    apiBasePath?: string;
    websiteBasePath?: string;
    tenantId?: string;
    devOrgId?: string;
    loginAppUrl?: string;
    consoleAppUrl?: string;
  };
  localDeployment?: boolean;
}

/**
 * Auth context interface for use in router and route guards
 */
export interface AuthContextType {
  userId?: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  orgId: string;
  userType?: string;
  tokenPayload: TokenPayload | null;
  authConfig: AuthConfig;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkCurrentOrgInMap: () => Promise<OrgCheckState>;
  isUserASuperAdmin: () => Promise<boolean>;
  setOrgId: (orgId: string) => boolean;
  // session is omitted as it's an external type
}

/**
 * Token payload interface
 */
export interface TokenPayload {
  antiCsrfToken: string | null;
  email: string;
  exp: number;
  first_name: string;
  iat: number;
  isEmailVerified: boolean;
  iss: string;
  last_name: string;
  parentRefreshTokenHash1: string | null;
  refreshTokenHash1: string;
  rsub: string;
  sessionHandle: string;
  'st-ev': { v: boolean; t: number };
  sub: string;
  tId: string;
  user_id: string;
  user_type: number;
}
