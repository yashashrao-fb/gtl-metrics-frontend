import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import Session from 'supertokens-auth-react/recipe/session';
import { verifyEmail } from 'supertokens-auth-react/recipe/emailverification';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';
import Footer from './Footer';

interface VerifyEmailPageProps {
  onNavigate?: (path: string) => void;
}

export default function VerifyEmailPage({ onNavigate }: VerifyEmailPageProps) {
  const [verifying, setVerifying] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [linkExpired, setLinkExpired] = useState(false);

  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate({ to: path });
    }
  };

  async function redirectToLogin() {
    handleNavigation('/login');
  }

  async function consumeVerificationCode() {
    try {
      // Use default verification without explicit token (like Angular implementation)
      const response = await verifyEmail();

      if (response.status === 'EMAIL_VERIFICATION_INVALID_TOKEN_ERROR') {
        // This can happen if the verification code is expired or invalid
        setLinkExpired(true);
        setErrorMessage('Verification link has expired');
        handleNavigation('/');
        return;
      }

      try {
        // Update claims by refreshing the session (equivalent to updateEmailVerificationClaims in Angular)
        await refreshSession();
        // Navigate immediately like Angular does, not with a delay
        handleNavigation('/');
      } catch (claimsError) {
        // If claims update fails, log out the user for security
        console.error('Failed to update claims:', claimsError);
        setErrorMessage(
          'Failed to update user information. Please login again.'
        );
        // In Angular implementation this triggers logout and goes to login page
        handleNavigation('/login');
      }
    } catch (err: any) {
      if (err.isSuperTokensGeneralError === true) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Something went wrong, please try again');
      }
    } finally {
      setVerifying(false);
    }
  }

  useEffect(() => {
    async function checkSessionAndVerify() {
      try {
        const sessionExists = await Session.doesSessionExist();
        if (!sessionExists) {
          // Same as Angular, navigate away if no session
          handleNavigation('/');
          return;
        }

        await consumeVerificationCode();
      } catch (err) {
        console.error('Error checking session:', err);
        setErrorMessage('Something went wrong, please try again');
        setVerifying(false);
      }
    }

    checkSessionAndVerify();
  }, []);

  // Simplify UI to match Angular implementation
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      {/* Verifying email state - like Angular version */}
      {verifying && (
        <section className="flex bg-neutral-900 h-screen items-center justify-center">
          <div
            className="text-text-1 text-xl"
            data-cy="verify-email-verifying-text"
          >
            Verifying your email <span className="dots">...</span>
          </div>
        </section>
      )}

      {/* Error/expired state - like Angular version */}
      {!verifying && (errorMessage || linkExpired) && (
        <section className="bg-neutral-900 flex justify-center items-start min-h-screen pt-[100px] md:pt-[150px] lg:pt-[250px]">
          <div className="text-center w-full max-w-[345px] mx-auto">
            <img
              src="assets/flytbase-logo.svg"
              alt="Flytbase Logo"
              className="m-auto mb-8 h-10"
              data-cy="verify-email-fb-logo-large"
            />
            <div
              className="text-text-1 text-xl mb-4"
              data-cy="verify-email-error-header"
            >
              Verification Link Expired
            </div>

            <div
              className="text-gray-300 text-base mb-7"
              data-cy="verify-email-error-info"
            >
              The verification link you used is no longer valid. Please try
              logging in again.
            </div>

            <button
              onClick={redirectToLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-text-1 py-2 px-4 rounded"
              data-cy="verify-email-retry-button"
            >
              Return to Login
            </button>

            {errorMessage && (
              <div
                className="flex text-red-500 text-sm items-center mt-2 mb-4 justify-center"
                data-cy="verify-email-error-message"
              >
                {errorMessage}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 w-full">
        <Footer />
      </div>
    </div>
  );
}
