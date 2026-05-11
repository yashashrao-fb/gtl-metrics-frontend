/**
 * useGtlHttp — authenticated Axios instance for the GTL metrics backend.
 *
 * Separate from useHttp() which points at api.flytbase.com.
 * This points at our own Node.js backend (VITE_GTL_BACKEND_URL or localhost:3001).
 *
 * Auto-injects:
 *   Authorization: Bearer <SuperTokens access token>
 *   org-id: <resolved org ID>
 *
 * Usage:
 *   const http = useGtlHttp();
 *   const { data } = await http.get('/metrics/summary');
 */

import { useMemo, useRef, useEffect } from 'react';
import { createHttpClient } from '@auth';
import { useAuth } from '@auth';
import { environment } from '@env';

export function useGtlHttp() {
  const auth    = useAuth();
  const authRef = useRef(auth);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  return useMemo(
    () => createHttpClient(
      environment.gtlBackendUrl,
      auth.authConfig,
      () => authRef.current.orgId,
    ),
    // Recreate only when authConfig changes (not on every orgId change — ref handles that)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auth.authConfig],
  );
}
