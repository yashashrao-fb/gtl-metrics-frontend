import { useEffect } from 'react';
import Session from 'supertokens-web-js/recipe/session';
import { signInAndUp } from 'supertokens-web-js/recipe/thirdparty';
import { STORAGE_KEYS } from '../types';
import '../styles/auth.css';
import { useAuth } from '../hooks/useAuth';

/**
 * Component that handles the callback from third-party authentication providers.
 * This is simplified to match the Angular implementation.
 */
const ThirdPartyVerification = () => {
  const { authConfig } = useAuth();
  const defaultRedirectPath = authConfig.appInfo.consoleAppUrl as string;
  useEffect(() => {
    const handleThirdPartyCallback = async () => {
      // Check if session already exists
      const session = await Session.doesSessionExist();
      if (session) {
        window.location.href = defaultRedirectPath;
        return;
      }

      const pathname = window.location.pathname;
      const search = window.location.search;

      if (!pathname || !search) {
        window.location.href = defaultRedirectPath;
        return;
      }

      // Get redirect origin from session storage (same as Angular)
      let redirectOrigin = sessionStorage.getItem(STORAGE_KEYS.SESSION_ORIGIN);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_ORIGIN);

      if (!redirectOrigin) {
        redirectOrigin = defaultRedirectPath;
      }

      try {
        const response = await signInAndUp();
        if (response.status === 'OK') {
          window.location.href = redirectOrigin;
        } else if (response.status === 'SIGN_IN_UP_NOT_ALLOWED') {
          window.location.href = `${redirectOrigin}/login`;
        } else {
          window.location.href = `${redirectOrigin}/login`;
        }
      } catch (err) {
        window.location.href = `${redirectOrigin}/login`;
      }
    };

    handleThirdPartyCallback();
  }, [defaultRedirectPath]);

  // Simple loading display matching Angular's implementation
  return (
    <section className="flex items-center justify-center h-screen bg-neutral-900">
      <div className="text-text-1 text-xl font-medium">
        Redirecting to FlytBase<span className="dots"></span>
      </div>
    </section>
  );
};

export default ThirdPartyVerification;
