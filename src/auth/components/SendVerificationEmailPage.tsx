import { useEffect, useState } from 'react';
import Session from 'supertokens-auth-react/recipe/session';
import {
  isEmailVerified,
  sendVerificationEmail,
} from 'supertokens-auth-react/recipe/emailverification';
import { useNavigate } from '@tanstack/react-router';
import '../styles/auth.css';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';

export default function SendVerificationEmailPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const [hasEmailVerified, setHasEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { authConfig } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const checkSession = async () => {
        const sessionExists = await Session.doesSessionExist();
        setHasSession(sessionExists);
        if (!sessionExists) {
          navigate({ to: '/' });
        }
      };

      const checkVerification = async () => {
        const isVerified = await isEmailVerified();
        if (isVerified.isVerified) {
          setHasEmailVerified(true);
          navigate({ to: '/' });
          return;
        }
      };

      checkSession();
      checkVerification();
    } catch (err) {
      console.error('Error checking session/email verification:', err);
      setError('Something went wrong with verification, please try again');
    }
  }, []);

  async function sendVerifyEmail() {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const origin =
        window.location.origin + (authConfig.appInfo.websiteBasePath ?? '');
      const response = await sendVerificationEmail({
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

      if (response.status === 'EMAIL_ALREADY_VERIFIED_ERROR') {
        navigate({ to: '/' });
      } else {
        setSuccess(
          'Verification email sent successfully! Please check your inbox.'
        );
      }
    } catch (err: any) {
      if (err.isSuperTokensGeneralError === true) {
        setError(err.message);
      } else {
        setError('Something went wrong, please try again');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      {hasSession && hasEmailVerified ? (
        <div className="flex-1 flex items-center justify-center">
          <div
            className="text-text-1 text-xl"
            data-cy="send-verification-email-checking-text"
          >
            Checking verification status...
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-start justify-center pt-[100px] md:pt-[150px] lg:pt-[200px]">
          <div className="text-center w-full max-w-md px-4">
            <div className="space-y-6">
              <div className="flex justify-center mb-8">
                <img
                  src="assets/flytbase-logo.svg"
                  alt="Flytbase Logo"
                  className="h-10"
                  data-cy="user-input-fb-logo-large"
                />
              </div>

              <h2
                className="text-text-1 text-xl mb-4"
                data-cy="user-input-check-your-inbox"
              >
                Verify Your Email
              </h2>

              <p
                className="text-gray-300 mx-auto max-w-[345px]"
                data-cy="user-input-a-magic-link"
              >
                Please verify your email address to access all features. We'll
                send you a verification link.
              </p>

              <div className="mt-6">
                <button
                  onClick={sendVerifyEmail}
                  disabled={isLoading}
                  className="w-full bg-blue-400 hover:bg-blue-500 text-zinc-900 font-medium py-2 px-4 rounded disabled:opacity-70 disabled:cursor-not-allowed"
                  data-cy="send-verification-email-component-continue-button"
                >
                  {isLoading ? 'Sending...' : 'Send Verification Email'}
                </button>

                {error && (
                  <div
                    className="flex text-red-500 text-sm items-center mt-2"
                    data-cy="send-verification-email-error-message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    className="flex text-green-500 text-sm items-center mt-2"
                    data-cy="send-verification-email-success-message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {success}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
