/**
 * GTL Dashboard Login Page
 *
 * A self-contained login page that:
 *  - Uses ThirdPartyAuth from the auth-export (Google + Microsoft OAuth via login.flytbase.com)
 *  - Uses a custom email magic-link form (PasswordlessAuth uses TanStack Router; we handle
 *    navigation ourselves with window.location)
 *
 * After a successful OAuth callback the user lands back here and the
 * SuperTokens session is automatically detected — App.tsx shows the dashboard.
 */

import { useState, FormEvent, ReactNode } from 'react';
import { createCode } from 'supertokens-auth-react/recipe/passwordless';
import { ThirdPartyAuth } from '@auth';
import { useAuth } from '@auth';
import { STORAGE_KEYS } from '@auth';
import logo from '../assets/logo.png';

type Screen = 'login' | 'link-sent';

export default function GTLLoginPage() {
  const { authConfig } = useAuth();
  const [screen, setScreen]   = useState<Screen>('login');
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const origin = window.location.origin + (authConfig.appInfo.websiteBasePath ?? '/');
      const response = await createCode({
        email,
        options: {
          preAPIHook: async (ctx) => {
            if (!ctx.requestInit.headers) ctx.requestInit.headers = {};
            (ctx.requestInit.headers as Record<string, string>)['x-redirect-uri'] = origin;
            return ctx;
          },
        },
      });

      if ((response as any).status === 'OK') {
        sessionStorage.setItem(STORAGE_KEYS.PASSWORDLESS_EMAIL, email);
        if ((response as any).deviceId) {
          sessionStorage.setItem(STORAGE_KEYS.PASSWORDLESS_DEVICE_ID, (response as any).deviceId);
        }
        setScreen('link-sent');
      } else {
        setError('Failed to send login link. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── "Check your email" screen ─────────────────────────────────────────────
  if (screen === 'link-sent') {
    return (
      <LoginShell>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-white font-semibold text-lg">Check your email</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            We sent a login link to<br />
            <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-zinc-600 text-xs">Click the link in the email to sign in.</p>
          <button
            onClick={() => { setScreen('login'); setEmail(''); }}
            className="text-zinc-500 hover:text-zinc-300 text-xs underline transition"
          >
            Use a different email
          </button>
        </div>
      </LoginShell>
    );
  }

  // ── Main login screen ─────────────────────────────────────────────────────
  return (
    <LoginShell>
      {/* OAuth buttons (Google + Microsoft) */}
      <ThirdPartyAuth />

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <hr className="flex-1 border-white/10" />
        <span className="text-zinc-600 text-xs">or continue with email</span>
        <hr className="flex-1 border-white/10" />
      </div>

      {/* Magic link email form */}
      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email"
          className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
        />
        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-semibold text-sm py-2.5 rounded-lg transition-all shadow-lg shadow-white/10"
        >
          {loading ? 'Sending link…' : 'Continue'}
        </button>
      </form>
    </LoginShell>
  );
}

// ── Shared shell (logo + card) ────────────────────────────────────────────────
function LoginShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Atmospheric gradients */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#111111] to-transparent opacity-50 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[140%] h-[60vh] bg-[radial-gradient(circle_at_50%_0%,rgba(44,123,242,0.1),transparent_70%)] blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={logo}
            alt="FlytBase"
            className="h-8 w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Card */}
        <div className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-center text-white font-semibold text-xl mb-1 tracking-tight">
            Welcome back
          </h1>
          <p className="text-center text-zinc-500 text-xs uppercase tracking-[0.2em] mb-7">
            First Reach · Analytics
          </p>

          {children}
        </div>

        <p className="text-center text-zinc-600 text-[10px] uppercase tracking-widest mt-8">
          © 2026 FlytBase · Time to Target Analytics
        </p>
      </div>
    </div>
  );
}
