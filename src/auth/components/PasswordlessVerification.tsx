import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  consumeCode,
  getLinkCodeFromURL,
  getPreAuthSessionIdFromURL,
  getLoginAttemptInfo,
  clearLoginAttemptInfo,
} from 'supertokens-auth-react/recipe/passwordless';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';

export default function PasswordlessVerification() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const search = useSearch({ from: '/verify' }) as { email?: string };

  // State variables to match Angular implementation
  const [userEmail, setUserEmail] = useState<string>('');
  const [redirecting, setRedirecting] = useState<boolean>(true);
  const [magicLinkInvalidOrExpired, setMagicLinkInvalidOrExpired] =
    useState<boolean>(false);
  const [
    magicLinkOpenedOnDifferentBrowser,
    setMagicLinkOpenedOnDifferentBrowser,
  ] = useState<boolean>(false);
  const [consumeMagicLinkProgressSpinner, setConsumeMagicLinkProgressSpinner] =
    useState<boolean>(false);

  // Extract user email from URL query parameters
  useEffect(() => {
    const encodedEmail = search.email;
    if (encodedEmail) {
      setUserEmail(decodeURIComponent(encodedEmail));
    }
  }, [search]);

  // Check magic link on component mount
  useEffect(() => {
    const checkMagicLink = async () => {
      try {
        // SuperTokens helper functions to get parameters from URL
        const userInputCode = getLinkCodeFromURL();
        const preAuthSessionId = getPreAuthSessionIdFromURL();

        if (userInputCode && preAuthSessionId) {
          const isSameBrowser = await isThisSameBrowserAndDevice();
          if (isSameBrowser) {
            await consumeMagicLink();
          } else {
            setRedirecting(false);
            setMagicLinkInvalidOrExpired(false);
            setMagicLinkOpenedOnDifferentBrowser(true);
          }
        } else {
          navigate({ to: '/login' });
        }
      } catch (err) {
        console.error('Magic link verification error:', err);
        navigate({ to: '/login-error' });
      }
    };

    if (!isAuthenticated) {
      checkMagicLink();
    } else {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, navigate]);

  // Function to check if this is the same browser and device
  const isThisSameBrowserAndDevice = async () => {
    return (await getLoginAttemptInfo()) !== undefined;
  };

  // Function to consume the magic link
  const consumeMagicLink = async () => {
    try {
      setConsumeMagicLinkProgressSpinner(true);

      const response = await consumeCode();

      if (response.status === 'OK') {
        await clearLoginAttemptInfo();
        await navigate({ to: '/' });
        setConsumeMagicLinkProgressSpinner(false);
      } else if (response.status === 'RESTART_FLOW_ERROR') {
        setRedirecting(false);
        setMagicLinkInvalidOrExpired(true);
        setMagicLinkOpenedOnDifferentBrowser(false);
        setConsumeMagicLinkProgressSpinner(false);
        await clearLoginAttemptInfo();
      } else {
        await navigate({ to: '/login-error' });
      }
    } catch (err) {
      console.error('Magic link consumption error:', err);
      await navigate({ to: '/login-error' });
    }
  };

  // Function to redirect to login page
  const redirectToLogin = () => {
    navigate({ to: '/login' });
  };

  return (
    <div className="bg-background-bg min-h-screen">
      {/* Verifying magic link - matches Angular's 'redirecting' state */}
      {redirecting && (
        <section className="flex bg-background h-screen items-center justify-center">
          <div className="on-primary-100 text-lg font-semibold text-on-surface-100">
            Redirecting to FlytBase <span className="dots">...</span>
          </div>
        </section>
      )}

      {/* Magic link expired or invalid - matches Angular's 'magicLinkInvalidOrExpired' state */}
      {magicLinkInvalidOrExpired && !magicLinkOpenedOnDifferentBrowser && (
        <section className="bg-background-bg flex justify-center items-start min-h-screen pt-[100px] md:pt-[150px] lg:pt-[250px]">
          <div className="text-center w-full max-w-[345px] mx-auto">
            <img
              src="assets/flytbase-logo.svg"
              alt="fb-logo"
              className="m-auto mb-8"
              data-cy="passwordless-verification-fb-logo-large"
            />
            <div className="text-on-surface-100 text-lg font-semibold mb-4">
              Magic link has expired
            </div>

            <div className="text-gray-400 text-sm mb-7">
              This magic link has expired. Please request a new one to log in to
              your account.
            </div>

            <button
              className="w-full bg-blue-400 text-zinc-900 py-2 px-4 rounded font-medium"
              onClick={redirectToLogin}
              data-cy="passwordless-verification-magic-link-expired-retry-button"
            >
              Retry Login
            </button>

            {/* Change Email Template */}
            <div className="mt-3 text-gray-400 text-xs">
              Not the right account?{' '}
              <span
                className="text-primary-200 cursor-pointer"
                onClick={redirectToLogin}
                data-cy="passwordless-verification-change-email-button"
              >
                Change email
              </span>
            </div>

            {/* Sign-in Footer would go here */}
          </div>
        </section>
      )}

      {/* Magic link opened on different browser - matches Angular's 'magicLinkOpenedOnDifferentBrowser' state */}
      {magicLinkOpenedOnDifferentBrowser &&
        !redirecting &&
        !magicLinkInvalidOrExpired && (
          <section className="bg-background-bg flex justify-center items-start min-h-screen pt-[100px] md:pt-[150px] lg:pt-[250px]">
            <div className="text-center w-full max-w-[345px] mx-auto">
              <div className="m-auto mb-5">
                <img
                  src="assets/flytbase-logo.svg"
                  alt="fb-logo"
                  className="m-auto mb-8"
                  data-cy="passwordless-verification-fb-logo-large"
                />
                <div className="text-text-1 text-lg font-semibold mb-4">
                  Login to FlytBase
                </div>
                <div className="text-gray-400 text-sm mb-8">
                  Email verified. You are continuing as{' '}
                  <span className="text-text-1">{userEmail}</span>.
                </div>
              </div>

              <button
                className="w-full bg-blue-400 hover:bg-blue-500 text-zinc-900 py-2 px-4 rounded font-medium"
                onClick={consumeMagicLink}
                disabled={consumeMagicLinkProgressSpinner}
                data-cy="passwordless-verification-continue-button"
              >
                {consumeMagicLinkProgressSpinner ? 'Loading...' : 'Continue'}
              </button>

              {/* Change Email Template */}
              <div className="mt-3 text-gray-400 text-xs">
                Not the right account?{' '}
                <span
                  className="text-primary-200 cursor-pointer"
                  onClick={redirectToLogin}
                  data-cy="passwordless-verification-change-email-button"
                >
                  Change email
                </span>
              </div>

              {/* Sign-in Footer would go here */}
            </div>
          </section>
        )}
    </div>
  );
}
