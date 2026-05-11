import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createCode } from 'supertokens-auth-react/recipe/passwordless';
import { useAuth } from '../hooks/useAuth';
import { STORAGE_KEYS } from '../types';
// Define an interface to extend the SuperTokens response type
interface ExtendedCreateCodeResponse {
  status: string;
  deviceId?: string;
  preAuthSessionId?: string;
  flowType?: string;
  fetchResponse?: Response;
}

export default function PasswordlessAuth() {
  const navigate = useNavigate();
  const { isAuthenticated, authConfig } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Navigate to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, navigate]);

  // Early return if authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Get the current origin to use in the magic link
      const origin =
        window.location.origin + (authConfig.appInfo.websiteBasePath || '');
      const response = await createCode({
        email,
        options: {
          preAPIHook: async (context) => {
            // Ensure headers object exists
            if (!context.requestInit.headers) {
              context.requestInit.headers = {};
            }
            // Add custom header to tell backend which domain to use for links
            context.requestInit.headers = {
              ...context.requestInit.headers,
              'x-redirect-uri': origin,
            };
            return context;
          },
        },
      });

      const extendedResponse = response as ExtendedCreateCodeResponse;
      if (extendedResponse.status === 'OK') {
        // Store email and deviceId in sessionStorage for access on the link-sent page
        sessionStorage.setItem(STORAGE_KEYS.PASSWORDLESS_EMAIL, email);

        // Store deviceId for verification later
        if (extendedResponse.deviceId) {
          sessionStorage.setItem(
            STORAGE_KEYS.PASSWORDLESS_DEVICE_ID,
            extendedResponse.deviceId
          );
        }

        // Navigate to link-sent page without passing params in URL
        navigate({
          to: '/link-sent',
        });
      } else {
        navigate({
          to: '/login-error',
        });
        setError('Failed to send verification code. Please try again.');
      }
    } catch (err) {
      navigate({
        to: '/login-error',
      });
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailSubmit} className="w-full">
      <div className="mb-4">
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 rounded border border-neutral-600 bg-transparent text-text-1 focus:bg-transparent focus:outline-none focus:border-blue-500"
          required
        />
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      </div>
      <button
        type="submit"
        className="w-full bg-blue-400 hover:bg-blue-500 text-zinc-800 font-medium py-3 px-4 rounded transition duration-200"
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Continue'}
      </button>
    </form>
  );
}
