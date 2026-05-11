/**
 * OAuth callback handler — router-free version.
 * Replaces auth-export's ThirdPartyAuthCallback which uses TanStack Router.
 * Called when login.flytbase.com redirects back to /auth/callback/google.
 */

import { useEffect } from 'react';
import Session from 'supertokens-web-js/recipe/session';
import { signInAndUp } from 'supertokens-web-js/recipe/thirdparty';
import { STORAGE_KEYS } from '@auth';
import { useAuth } from '@auth';

export default function GTLThirdPartyCallback() {
  const { authConfig } = useAuth();
  const fallback = authConfig.appInfo.consoleAppUrl ?? '/';

  useEffect(() => {
    const handle = async () => {
      // Session already exists — just go home
      if (await Session.doesSessionExist()) {
        window.location.href = '/';
        return;
      }

      let redirectOrigin = sessionStorage.getItem(STORAGE_KEYS.SESSION_ORIGIN) ?? fallback;
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_ORIGIN);

      try {
        const response = await signInAndUp();
        if (response.status === 'OK') {
          window.location.href = redirectOrigin;
        } else {
          window.location.href = `${redirectOrigin}/`;
        }
      } catch {
        window.location.href = `${redirectOrigin}/`;
      }
    };

    handle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-lg font-medium">
        Redirecting to FlytBase<span className="animate-pulse">…</span>
      </p>
    </div>
  );
}
