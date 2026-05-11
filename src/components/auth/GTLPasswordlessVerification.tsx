/**
 * Magic-link verification — router-free version.
 * Replaces auth-export's PasswordlessVerification which uses TanStack Router.
 * Uses window.location for all navigation.
 */

import { useEffect, useState } from 'react';
import {
  consumeCode,
  getLinkCodeFromURL,
  getPreAuthSessionIdFromURL,
  getLoginAttemptInfo,
  clearLoginAttemptInfo,
} from 'supertokens-auth-react/recipe/passwordless';
import { useAuth } from '@auth';

export default function GTLPasswordlessVerification() {
  const { isAuthenticated } = useAuth();

  const [state, setState] = useState<
    'loading' | 'expired' | 'different-browser' | 'error'
  >('loading');
  const [spinning, setSpinning] = useState(false);

  const goToLogin = () => { window.location.href = '/'; };

  const consumeMagicLink = async () => {
    try {
      setSpinning(true);
      const response = await consumeCode();
      if (response.status === 'OK') {
        await clearLoginAttemptInfo();
        window.location.href = '/';
      } else if (response.status === 'RESTART_FLOW_ERROR') {
        await clearLoginAttemptInfo();
        setState('expired');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    } finally {
      setSpinning(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) { window.location.href = '/'; return; }

    const check = async () => {
      const code    = getLinkCodeFromURL();
      const session = getPreAuthSessionIdFromURL();

      if (!code || !session) { goToLogin(); return; }

      const sameBrowser = (await getLoginAttemptInfo()) !== undefined;
      if (sameBrowser) {
        await consumeMagicLink();
      } else {
        setState('different-browser');
      }
    };

    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg font-medium">
          Signing you in<span className="animate-pulse">…</span>
        </p>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <AuthErrorShell
        title="Link expired"
        body="This magic link has expired. Please request a new one."
        onAction={goToLogin}
        actionLabel="Back to login"
      />
    );
  }

  if (state === 'different-browser') {
    return (
      <AuthErrorShell
        title="Continue sign-in"
        body="Your email was verified. Click below to complete login."
        onAction={consumeMagicLink}
        actionLabel={spinning ? 'Loading…' : 'Continue'}
        disabled={spinning}
        secondary={{ label: 'Use a different email', onClick: goToLogin }}
      />
    );
  }

  return (
    <AuthErrorShell
      title="Something went wrong"
      body="We could not sign you in. Please try again."
      onAction={goToLogin}
      actionLabel="Back to login"
    />
  );
}

function AuthErrorShell({
  title, body, onAction, actionLabel, disabled, secondary,
}: {
  title: string;
  body: string;
  onAction: () => void;
  actionLabel: string;
  disabled?: boolean;
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-4">
        <h2 className="text-white font-semibold text-lg">{title}</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">{body}</p>
        <button
          onClick={onAction}
          disabled={disabled}
          className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-semibold text-sm py-2.5 rounded-lg transition-all"
        >
          {actionLabel}
        </button>
        {secondary && (
          <button onClick={secondary.onClick} className="text-zinc-500 hover:text-zinc-300 text-xs underline transition">
            {secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}
