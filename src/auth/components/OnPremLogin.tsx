import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';
import { signIn } from 'supertokens-auth-react/recipe/emailpassword';
import Session from 'supertokens-web-js/recipe/session';

// Define TeamManagementConfig interface
interface TeamManagementConfig {
  account: string;
  admin: string;
  sub_domain_suffix: string;
  domain: string;
}

interface FormValues {
  email: string;
  password: string;
}

export default function OnPremLogin() {
  const navigate = useNavigate();
  const { authConfig } = useAuth();
  const [sessionExist, setSessionExist] = useState(false);
  const [signInProgressLoader, setSignInProgressLoader] = useState(false);
  const [apiError, setApiError] = useState('');

  // TeamManagement config from authConfig
  const teamManagement: TeamManagementConfig = {
    admin: authConfig?.appInfo?.consoleAppUrl || '',
    account: authConfig?.appInfo?.loginAppUrl || '',
    domain: authConfig?.appInfo?.websiteDomain || '',
    sub_domain_suffix: '',
  };

  // Email and password regex patterns
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Set up the form with react-hook-form in a more React-specific way
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange', // Validate on change
  });

  // Check for existing session and handle redirections
  useEffect(() => {
    const checkSessionAndParams = async () => {
      try {
        // Check if session exists
        const doesSessionExist = await Session.doesSessionExist();
        setSessionExist(doesSessionExist);

        if (doesSessionExist) {
          await navigate({ to: '/' });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSessionAndParams();
  }, [navigate]);

  // Clear API errors when form values change
  useEffect(() => {
    if (apiError && isSubmitting) {
      setApiError('');
    }
  }, [isSubmitting, apiError]);

  // Handle sign in process
  const signInClicked = async (data: FormValues) => {
    setSignInProgressLoader(true);
    setApiError('');

    try {
      const response = await signIn({
        formFields: [
          { id: 'email', value: data.email.trim() },
          { id: 'password', value: data.password.trim() },
        ],
      });

      if (response.status === 'FIELD_ERROR') {
        response.formFields.forEach((formField) => {
          if (formField.id === 'email') {
            setApiError('Invalid email or password');
          }
        });
      } else if (response.status === 'WRONG_CREDENTIALS_ERROR') {
        setApiError('Incorrect email or password');
      } else if (response.status === 'SIGN_IN_NOT_ALLOWED') {
        navigate({ to: '/login-error' });
      } else {
        // Success - navigate home
        await navigate({ to: '/' });
      }
    } catch (err) {
      console.error('Sign in error:', err);
      await navigate({ to: '/login-error' });
    } finally {
      setSignInProgressLoader(false);
    }
  };

  // Handle sign up redirection
  const redirectToSignUp = () => {
    window.location.href = `${teamManagement.admin}/signup`;
  };

  // Render the loading state when session exists
  if (sessionExist) {
    return (
      <section className="bg-background flex justify-center items-center min-h-screen">
        <div className="text-on-surface-100 fb-heading">Logging you in...</div>
      </section>
    );
  }

  // Main login template
  return (
    <section className="bg-background-bg flex justify-center items-start min-h-screen pt-[100px] md:pt-[150px] lg:pt-[200px]">
      <div className="text-center w-full max-w-[350px] mx-auto">
        {/* Login header */}
        <div>
          <img
            src="assets/flytbase-logo.svg"
            alt="fb-logo"
            className="m-auto mb-8"
          />
          <div className="text-on-surface-100 fb-mega mb-7">Login</div>
        </div>

        {/* Email password form - Using Controller for better form control */}
        <form onSubmit={handleSubmit(signInClicked)} className="space-y-4">
          <div className="space-y-4">
            {/* Email input with Controller */}
            <div>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: emailRegex,
                    message: 'Please enter a valid email',
                  },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    placeholder="Email"
                    className="w-full p-3 rounded border border-gray-600 bg-transparent text-text-1 focus:outline-none focus:border-blue-500"
                    autoComplete="email"
                  />
                )}
              />
              {errors.email && (
                <div className="flex text-error-30 fb-label-3 items-center mt-1">
                  <i className="fa-regular fa-circle-exclamation mr-1"></i>
                  {errors.email.message}
                </div>
              )}
            </div>

            {/* Password input with Controller */}
            <div>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Password is required',
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 rounded border border-gray-600 bg-transparent text-text-1 focus:outline-none focus:border-blue-500"
                    autoComplete="current-password"
                  />
                )}
              />
              {errors.password && (
                <div className="flex text-error-30 fb-label-3 items-center mt-1">
                  <i className="fa-regular fa-circle-exclamation mr-1"></i>
                  {errors.password.message}
                </div>
              )}
            </div>
          </div>

          {/* API error message */}
          {apiError && (
            <div className="p-3 bg-error-container text-error-30 fb-label-3 rounded">
              {apiError}
            </div>
          )}

          {/* Continue button */}
          <button
            type="submit"
            className={`w-full bg-blue-400 hover:bg-blue-500 text-zinc-900 font-medium py-3 px-4 rounded transition duration-200 ${
              signInProgressLoader ? 'pointer-events-none opacity-70' : ''
            }`}
            disabled={!isValid || signInProgressLoader}
          >
            {signInProgressLoader ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Continue</span>
              </div>
            ) : (
              'Continue'
            )}
          </button>

          <div className="text-surface fb-body-4 mt-3">
            Don't have an account?{' '}
            <span
              className="text-blue-400 fb-body-4 cursor-pointer"
              onClick={redirectToSignUp}
            >
              Sign up
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}
