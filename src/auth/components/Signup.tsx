import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import '../styles/auth.css';
import { signUp } from 'supertokens-auth-react/recipe/emailpassword';
import Session from 'supertokens-web-js/recipe/session';

interface FormValues {
  email: string;
  setPassword: string;
  confirmPassword: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const [sessionExist, setSessionExist] = useState(false);
  const [signUpProgressLoader, setSignUpProgressLoader] = useState(false);
  const [apiError, setApiError] = useState('');

  // Email and password regex patterns
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[0-9]).{5,}$/;

  // Set up the form with react-hook-form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      email: '',
      setPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange', // Validate on change
  });

  // Watch password for matching validation
  const password = watch('setPassword');

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const doesSessionExist = await Session.doesSessionExist();
        setSessionExist(doesSessionExist);

        if (doesSessionExist) {
          await navigate({ to: '/' });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();
  }, [navigate]);

  // Clear API errors when form values change
  useEffect(() => {
    if (apiError && isSubmitting) {
      setApiError('');
    }
  }, [isSubmitting, apiError]);

  // Handle sign up process
  const handleSignUp = async (data: FormValues) => {
    setSignUpProgressLoader(true);
    setApiError('');

    try {
      const response = await signUp({
        formFields: [
          { id: 'email', value: data.email.trim() },
          { id: 'password', value: data.setPassword.trim() },
        ],
      });

      if (response.status === 'FIELD_ERROR') {
        response.formFields.forEach((formField) => {
          if (
            formField.id === 'email' &&
            formField.error.includes('This email already exists')
          ) {
            setApiError(
              'This email is already registered. Please log in or use a different email.'
            );
          } else if (formField.id === 'password') {
            setApiError(formField.error);
          }
        });
      } else if (response.status === 'SIGN_UP_NOT_ALLOWED') {
        navigate({ to: '/login-error' });
      } else {
        // Success - navigate home
        await navigate({ to: '/' });
      }
    } catch (err) {
      console.error('Sign up error:', err);
      await navigate({ to: '/login-error' });
    } finally {
      setSignUpProgressLoader(false);
    }
  };

  // Redirect to login page
  const redirectToLogin = () => {
    navigate({ to: '/login' });
  };

  // Render the loading state when session exists
  if (sessionExist) {
    return (
      <section className="bg-background flex justify-center items-center min-h-screen">
        <div className="text-text-1 fb-heading">Logging you in...</div>
      </section>
    );
  }

  // Main signup template
  return (
    <section className="bg-background flex justify-center items-start min-h-screen pt-[100px] md:pt-[150px] lg:pt-[200px]">
      <div className="text-center w-full max-w-[350px] mx-auto">
        {/* Header */}
        <div>
          <img
            src="assets/flytbase-logo.svg"
            alt="FlytBase Logo"
            className="m-auto mb-8"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const textNode = document.createElement('div');
                textNode.textContent = 'FlytBase';
                textNode.className = 'text-text-1 text-3xl font-semibold';
                parent.appendChild(textNode);
              }
            }}
          />
          <div className="text-text-1 fb-mega mb-7">Sign Up</div>
        </div>

        {/* Sign up form */}
        <form onSubmit={handleSubmit(handleSignUp)} className="space-y-4">
          <div className="space-y-4">
            {/* Email input */}
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

            {/* Set Password input */}
            <div>
              <Controller
                name="setPassword"
                control={control}
                rules={{
                  required: 'Password is required',
                  pattern: {
                    value: passwordRegex,
                    message:
                      'Password must have at least 5 characters, one uppercase letter, one number, and one special character',
                  },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="password"
                    placeholder="Set Password"
                    className="w-full p-3 rounded border border-gray-600 bg-transparent text-text-1 focus:outline-none focus:border-blue-500"
                    autoComplete="new-password"
                  />
                )}
              />
              {errors.setPassword && (
                <div className="flex text-error-30 fb-label-3 items-center mt-1">
                  <i className="fa-regular fa-circle-exclamation mr-1"></i>
                  {errors.setPassword.message}
                </div>
              )}
            </div>

            {/* Confirm Password input */}
            <div>
              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password ||
                    'Passwords do not match. Please try again.',
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full p-3 rounded border border-gray-600 bg-transparent text-text-1 focus:outline-none focus:border-blue-500"
                    autoComplete="new-password"
                  />
                )}
              />
              {errors.confirmPassword && (
                <div className="flex text-error-30 fb-label-3 items-center mt-1">
                  <i className="fa-regular fa-circle-exclamation mr-1"></i>
                  {errors.confirmPassword.message}
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

          {/* Sign up button */}
          <button
            type="submit"
            className={`w-full bg-blue-400 hover:bg-blue-500 text-zinc-900 font-medium py-3 px-4 rounded transition duration-200 ${
              signUpProgressLoader ? 'pointer-events-none opacity-70' : ''
            }`}
            disabled={!isValid || signUpProgressLoader}
          >
            {signUpProgressLoader ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Signing Up</span>
              </div>
            ) : (
              'Sign Up'
            )}
          </button>

          <div className="text-text-1 fb-body-2 mt-3">
            Already have an account?{' '}
            <span
              className="text-primary-50 fb-body-2 cursor-pointer"
              onClick={redirectToLogin}
            >
              Login
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}
