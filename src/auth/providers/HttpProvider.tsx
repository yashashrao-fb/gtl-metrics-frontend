import React, {
  createContext,
  useMemo,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { AxiosInstance } from 'axios';
import { createHttpClient } from '../utils/httpClient';
import { useAuth } from '../hooks/useAuth';
import { AUTH_DEFAULTS, AuthContextType } from '../types';

// Context for the HTTP client
export type HttpContextType = {
  client: AxiosInstance;
};

export const HttpContext = createContext<HttpContextType | null>(null);

interface HttpProviderProps {
  children: ReactNode;
  routerConfig?: {
    setAuthContext?: (auth: AuthContextType, httpClient: AxiosInstance) => void;
  };
}

/**
 * HttpProvider - Provides an Axios HTTP client with authentication
 *
 * Non-blocking provider that creates HTTP client and sets router context.
 * Always renders children immediately for progressive rendering.
 */
export const HttpProvider: React.FC<HttpProviderProps> = ({
  children,
  routerConfig,
}: HttpProviderProps) => {
  // Get authentication information from AuthProvider
  const auth = useAuth();

  // Use ref to always have access to latest orgId, avoiding closure staleness
  const authRef = useRef(auth);

  // Update ref on every render to ensure it always has the latest auth value
  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  // Create the HTTP client with the organization ID from props or auth context
  const client = useMemo(() => {
    // Prioritize baseUrl from props, fallback to apiDomain from auth config
    const effectiveBaseUrl =
      auth.authConfig?.appInfo?.apiDomain || AUTH_DEFAULTS.HTTP_BASE_URL;

    // Use ref to get current orgId - guarantees we always get the latest value
    // even if the auth object reference changes across renders
    return createHttpClient(
      effectiveBaseUrl,
      auth.authConfig,
      () => authRef.current.orgId
    );
  }, [auth.authConfig]);

  /**
   * Router Context Setup Effect
   *
   * Sets router context with auth and HTTP client.
   * Non-blocking - runs asynchronously, doesn't prevent rendering.
   *
   * HMR Handling:
   * On HMR, the router module reloads and context resets, but React preserves
   * this component instance. We detect HMR via import.meta.hot and force
   * context re-initialization by setting up a counter that increments on HMR.
   */
  const [hmrCounter, setHmrCounter] = React.useState(0);

  // HMR Detection: Force re-run when router module reloads
  useEffect(() => {
    if (import.meta.env.DEV && import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => {
        // Increment counter to force useEffect re-run
        setHmrCounter((prev) => prev + 1);
      });
    }
  }, []);

  useEffect(() => {
    if (!auth || !auth.authConfig) {
      return;
    }

    if (!client) {
      return;
    }

    if (routerConfig?.setAuthContext) {
      routerConfig.setAuthContext(auth, client);

      if (import.meta.env.DEV && hmrCounter > 0) {
        console.log('[HttpProvider] Router context re-initialized after HMR', {
          hmrCounter,
        });
      }
    }
  }, [auth, client, routerConfig, hmrCounter]);

  /**
   * Non-Blocking Render
   *
   * Always renders children immediately, even before router context is set.
   * This allows:
   * - Progressive rendering (no blocking LoadingScreen)
   * - Faster perceived load time
   * - Guards handle their own loading states
   * - Better user experience
   */
  return (
    <HttpContext.Provider value={{ client }}>{children}</HttpContext.Provider>
  );
};

// Hook to use the HTTP client
