import { createContext, ReactElement, ReactNode, useEffect, useState } from 'react';
import {
  useSessionContext,
  signOut,
} from 'supertokens-auth-react/recipe/session';
import Session from 'supertokens-auth-react/recipe/session';
import { initializeSuperTokens } from '../config/SuperTokensConfig';
import {
  OrgCheckState,
  AuthConfig,
  AuthContextType as IAuthContextType,
  TokenPayload,
} from '../types';

// Extend the interface to include the session from SuperTokens
type AuthContextType = IAuthContextType & {
  session: ReturnType<typeof useSessionContext>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  authConfig,
  backendUrl,
}: {
  children: ReactNode;
  authConfig: AuthConfig;
  backendUrl?: string;
}): ReactElement {
  // Extract the backendUrl from authConfig if not explicitly provided
  const effectiveBackendUrl = backendUrl || authConfig.appInfo.apiDomain;
  const session = useSessionContext();
  const [orgId, setOrgId] = useState<string>('');
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null);
  const isAuthenticated = !session.loading && 'doesSessionExist' in session && session.doesSessionExist === true;

  const getDomainName = (hostname: string) => {
    if (hostname === 'localhost') return hostname;
    const parts = hostname.split('.');
    return parts.length > 2 ? parts.slice(1).join('.') : hostname;
  };

  /**
   * Set organization ID for API requests (equivalent to Angular's embedOrgForAccountAndConsole)
   * Validates ObjectId pattern and hostname before setting
   */
  const setOrgIdForApp = (orgId: string): boolean => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    // Allow setting orgId for development environments (localhost, pilot, Lovable)
    const isHostValid = [
      'pilot',
      'localhost',
      '.lovable.app',
      '.lovableproject.com',
    ].some((host) => window.location.hostname.includes(host));

    if (isHostValid) {
      if (objectIdPattern.test(orgId)) {
        setOrgId(orgId);
        return true;
      } else {
        console.warn('Invalid ObjectId format for orgId:', orgId);
        setOrgId('');
        return false;
      }
    }

    console.warn(
      'Invalid hostname for setting orgId:',
      window.location.hostname
    );
    return false;
  };

  const refreshSession = async (): Promise<void> => {
    const sessionExists = await Session.doesSessionExist();
    if (sessionExists) {
      await Session.attemptRefreshingSession();
      const payload = await Session.getAccessTokenPayloadSecurely();
      setTokenPayload(payload);
    } else {
      await logout();
    }
  };

  const logout = async () => {
    // Clear local storage and cookies
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    const cookies = document.cookie.split(';');
    const rootDomain = getDomainName(window.location.hostname);
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      const expires = new Date(Date.now() - 1000).toUTCString();
      document.cookie = `${name}=;expires=${expires};path=/;domain=${rootDomain}`;
    });

    await signOut();
  };

  const isUserASuperAdmin = async (): Promise<boolean> => {
    const payload = await Session.getAccessTokenPayloadSecurely();
    return payload?.['user_type'] === 'SUPER_ADMIN';
  };

  const checkCurrentOrgInMap = async (): Promise<OrgCheckState> => {
    // Implementation will use fetch to backend endpoint
    // For now returning placeholder value - will be updated when httpClient is implemented
    const subDomain = window.location.hostname;

    // Skip subdomain check for localhost and Lovable domains - use devOrgId instead
    const isLocalOrLovable =
      subDomain === 'localhost' ||
      ['.lovable.app', '.lovableproject.com'].some((host) =>
        subDomain.includes(host)
      );

    if (isLocalOrLovable) {
      // Use devOrgId specifically for development and Lovable deployments
      const devOrgId = authConfig?.appInfo?.devOrgId || '';

      if (!devOrgId) {
        console.warn(
          'No devOrgId provided in authConfig for localhost/Lovable development'
        );
      }

      setOrgId(devOrgId);
      return OrgCheckState.ORGANIZATION_FOUND;
    }

    try {
      const response = await fetch(
        `${effectiveBackendUrl}/auth_check/check_sub_domain/${subDomain}`
      );
      const data = await response?.json();

      if (data.orgEmpty) {
        setOrgId(data.orgId);
        return OrgCheckState.EMPTY_ORGANIZATION_MAP;
      }

      if (data.orgValid) {
        setOrgId(data.orgId);
        return OrgCheckState.ORGANIZATION_FOUND;
      }

      return OrgCheckState.ORGANIZATION_NOT_FOUND;
    } catch (error) {
      console.error('Error checking organization:', error);
      return OrgCheckState.ORGANIZATION_NOT_FOUND;
    }
  };

  // Create the auth context value
  const authContextValue: AuthContextType = {
    session,
    userId: session.loading ? undefined : tokenPayload?.['user_id']?.toString(),
    isLoading: session.loading,
    isAuthenticated,
    orgId,
    userType: tokenPayload?.['user_type']?.toString(),
    tokenPayload,
    authConfig,
    logout,
    refreshSession,
    checkCurrentOrgInMap,
    isUserASuperAdmin,
    setOrgId: setOrgIdForApp,
  };

  /**
   * Token Payload Loading Effect
   *
   * Loads token payload when user becomes authenticated.
   * Organization check is now handled by OrgProvider (not here).
   */
  useEffect(() => {
    if (!session.loading && 'doesSessionExist' in session && session.doesSessionExist === true) {
      Session.getAccessTokenPayloadSecurely().then((payload) => {
        setTokenPayload(payload);
      });
    }
  }, [session]);

  useEffect(() => {
    // Initialize SuperTokens with the full authConfig
    initializeSuperTokens(authConfig);
  }, [authConfig]);

  /**
   * Non-Blocking Render
   *
   * Always renders children immediately for non-blocking architecture.
   * OrgProvider handles organization validation separately.
   *
   * This allows:
   * - Progressive rendering (no blocking LoadingScreen)
   * - Better performance (no sequential delays)
   * - Cleaner separation of concerns
   * - Guards handle their own loading states
   */
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
