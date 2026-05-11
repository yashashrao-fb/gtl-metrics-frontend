import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  resendCode,
  consumeCode,
  clearLoginAttemptInfo,
} from 'supertokens-auth-react/recipe/passwordless';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';
import Footer from './Footer';
import { STORAGE_KEYS } from '../types';

// Define an interface to extend the SuperTokens response type
interface ExtendedResponse {
  status: string;
  deviceId?: string;
  preAuthSessionId?: string;
  flowType?: string;
  fetchResponse?: Response;
}

export default function LinkSentPage() {
  const navigate = useNavigate();
  const { isAuthenticated, authConfig } = useAuth();

  const email = sessionStorage.getItem(STORAGE_KEYS.PASSWORDLESS_EMAIL) || null;
  const deviceId =
    sessionStorage.getItem(STORAGE_KEYS.PASSWORDLESS_DEVICE_ID) || null;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isIncorrectCodeError, setIsIncorrectCodeError] = useState(false);
  const [isExpiredCodeError, setIsExpiredCodeError] = useState(false);

  useEffect(() => {
    // If no email or deviceId is provided in the URL, redirect back to login
    if (!email) {
      navigate({ to: '/login' });
      return;
    }

    // Get deviceId from session storage
    const storedDeviceId = sessionStorage.getItem(
      STORAGE_KEYS.PASSWORDLESS_DEVICE_ID
    );
    if (!storedDeviceId) {
      // If no deviceId is found, redirect back to login
      navigate({ to: '/login' });
    }

    // Start the countdown when component mounts
    startCountdown();

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [email, navigate]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, navigate]);

  // Reset error states when code changes
  useEffect(() => {
    if (isIncorrectCodeError || isExpiredCodeError) {
      setIsIncorrectCodeError(false);
      setIsExpiredCodeError(false);
    }
  }, [code]);

  // Start countdown function similar to Angular version
  const startCountdown = () => {
    setCountdown(15);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set new interval
    intervalRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown > 0) {
          return prevCountdown - 1;
        } else {
          // Clear interval when countdown reaches 0
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return 0;
        }
      });
    }, 1000);
  };

  // Early return if authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleResendCode = async () => {
    setError('');

    try {
      // Get the current origin to use in the magic link
      const origin =
        window.location.origin + (authConfig.appInfo.websiteBasePath || '');

      // Restart the countdown
      startCountdown();

      // For resendCode, we don't need to pass the email again as it's part of the session
      const response = await resendCode({
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

      const extendedResponse = response as ExtendedResponse;
      if (extendedResponse.status === 'RESTART_FLOW_ERROR') {
        // This can happen if the user has already successfully logged in into
        // another device whilst also trying to log in to this one.
        await clearLoginAttemptInfo();
        navigate({ to: '/login-error' });
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
      navigate({ to: '/login-error' });
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Ensure we have a deviceId
      if (!deviceId) {
        setError(
          'Session information is missing. Please try logging in again.'
        );
        return;
      }

      const response = await consumeCode({
        userInputCode: code,
        userContext: {
          deviceId,
        },
        options: {
          preAPIHook: async (context) => {
            // Modify the request body to include deviceId
            if (context.requestInit.body) {
              const reqBody = JSON.parse(context.requestInit.body as string);
              const newReqBody = {
                ...reqBody,
                deviceId,
              };
              context.requestInit.body = JSON.stringify(newReqBody);
            }
            return context;
          },
        },
      });

      if (response.status === 'OK') {
        // Successful login
        // Clear the deviceId as it's no longer needed
        sessionStorage.removeItem(STORAGE_KEYS.PASSWORDLESS_DEVICE_ID);
        // Clear login attempt info as done in Angular version
        await clearLoginAttemptInfo();
        // No need to navigate directly, the auth state change will trigger useEffect
      } else if (response.status === 'INCORRECT_USER_INPUT_CODE_ERROR') {
        setIsIncorrectCodeError(true);
        setError('Invalid code. Please try again.');
      } else if (response.status === 'EXPIRED_USER_INPUT_CODE_ERROR') {
        setIsExpiredCodeError(true);
        setError('This code has expired. Please request a new one.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center mx-auto w-[360px] px-4">
        <div className="w-full py-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="assets/flytbase-logo.svg"
              alt="Flytbase Logo"
              className="h-10"
              onError={(e) => {
                // Fallback text if logo doesn't load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const textNode = document.createElement('div');
                  textNode.textContent = 'Flytbase';
                  textNode.className = 'text-text-1 text-3xl font-semibold';
                  parent.appendChild(textNode);
                }
              }}
            />
          </div>

          <div className="w-full">
            <h2 className="text-center text-xl mb-3 text-text-1">
              Check your inbox
            </h2>
            <p className="text-gray-400 mb-5 text-sm text-center">
              A magic link and verification code has been sent to
              <span className="font-semibold mx-1 text-gray-300">{email}</span>
              If you don't see it in your inbox, please check your spam folder.
            </p>

            <form onSubmit={handleVerifyCode} className="w-full">
              <div className="mb-4">
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="w-full p-3 rounded border border-gray-600 bg-black text-text-1 focus:outline-none focus:border-blue-500"
                  required
                />
                {error && (
                  <div className="text-red-500 text-sm mt-1">{error}</div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-400 hover:bg-blue-500 text-text-1 font-medium py-3 px-4 rounded transition duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </button>

              <div className="text-center mt-4">
                <span className="text-gray-400">Didn't receive the email?</span>{' '}
                {countdown > 0 ? (
                  <span className="text-gray-400">
                    Resend in <span className="font-mono">{countdown}</span>s
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 font-medium"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    Resend
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
