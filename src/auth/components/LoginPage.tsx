import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import ThirdPartyAuth from './ThirdPartyAuth';
import PasswordlessAuth from './PasswordlessAuth';
import '../styles/auth.css';
import Footer from './Footer';
import { useEffect } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, navigate]);

  // Wait for session check to complete before rendering
  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center mx-auto w-full max-w-[400px] px-4">
        <div className="w-full py-4 sm:py-8">
          <div className="flex justify-center mb-8">
            <img
              src="assets/flytbase-logo.svg"
              onError={(e) => {
                e.currentTarget.src = 'assets/icons/login/fb-logo-large.svg';
              }}
              alt="Flytbase Logo"
              className="h-10"
            />
          </div>
          <h2 className="text-center text-xl text-text-1 mb-8">
            Login or Sign up
          </h2>

          {/* Auth components */}
          <ThirdPartyAuth />

          <div className="flex space-x-2 my-6 items-center w-full">
            <hr className="border-gray-600 flex-1" />
            <span className="px-3 text-gray-400 text-sm">or</span>
            <hr className="border-gray-600 flex-1" />
          </div>

          <PasswordlessAuth />
        </div>
      </div>
      <Footer />
    </div>
  );
}
