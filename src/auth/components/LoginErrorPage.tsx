import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import Session from 'supertokens-auth-react/recipe/session';
import '../styles/auth.css';

/**
 * Simple login error page component
 *
 * With a static error message,
 * a session check, and a button to return to the login page.
 */
export default function LoginErrorPage() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState(false);

  // Check if there's an active session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionExists = await Session.doesSessionExist();
        setHasSession(sessionExists);
        navigate({ to: '/' });
      } catch (error) {
        console.error('Error checking session:', error);
        setHasSession(false);
      }
    };

    checkSession();
  }, []);

  // Navigate back to login page
  const handleBackToLogin = () => {
    navigate({
      to: '/login',
    });
  };

  return (
    <>
      {hasSession ? (
        <div>
          <section className="bg-background-bg flex justify-center items-center min-h-screen">
            <div className="fb-mega">Logging you in...</div>
          </section>
        </div>
      ) : (
        <div>
          <section className="bg-background-bg flex justify-center items-start min-h-screen pt-[100px] md:pt-[150px] lg:pt-[250px]">
            <div className="text-center">
              <div>
                <img
                  src="assets/flytbase-logo.svg"
                  alt="fb-logo"
                  className="m-auto mb-8"
                />
                <div className="fb-mega text-text-1">Something went wrong</div>
                <div className="max-w-[345px] mt-4 space-y-8">
                  <div className="text-text-2 fb-body-4-medium">
                    We are sorry, but something went wrong. Please try again.
                  </div>
                  <div>
                    <button
                      className="bg-blue-400 hover:bg-blue-500 text-zinc-900 font-medium py-2 px-4 rounded transition duration-200"
                      onClick={handleBackToLogin}
                    >
                      Return to Login
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
