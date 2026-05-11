/**
 * App.tsx — GTL Metrics Dashboard
 *
 * Provider hierarchy (mirrors IDS dashboard):
 *   SuperTokensWrapper → AuthProvider → HttpProvider → AppContent
 *
 * Auth gate (simplified — no TanStack Router needed):
 *   loading              → spinner
 *   /auth/callback/*     → ThirdPartyAuthCallback (OAuth return)
 *   /verify              → PasswordlessVerification (magic-link return)
 *   not authenticated    → GTLLoginPage
 *   authenticated        → dashboard
 */

import React, { useState, useEffect } from 'react';
import { SuperTokensWrapper } from 'supertokens-auth-react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react';
import { AuthProvider, HttpProvider, AuthContextType } from '@auth';
import { useAuth } from '@auth';
import { environment } from '@env';
import { AxiosInstance } from 'axios';

import Header                      from './components/Header';
import OrbitSystem, { OrbitKpis } from './components/OrbitSystem';
import MetricModal                 from './components/MetricModal';
import GTLLoginPage                from './components/GTLLoginPage';
import GTLThirdPartyCallback       from './components/auth/GTLThirdPartyCallback';
import GTLPasswordlessVerification from './components/auth/GTLPasswordlessVerification';
import FlightDataPage from './pages/FlightDataPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage   from './pages/SettingsPage';
import PostFlightAuthPage from './pages/PostFlightAuthPage';
import ReportsPage    from './pages/ReportsPage';

import { useGtlHttp }  from './lib/useGtlHttp';
import { useSettings } from './context/SettingsContext';

// ── Auth config — sourced from environment runtime detector ───────────────────
const authConfig = {
  appInfo: {
    appName:         environment.appInfo.appName,
    tenantId:        environment.appInfo.tenantId,
    devOrgId:        environment.appInfo.devOrgId,
    websiteBasePath: environment.appInfo.websiteBasePath,
    apiBasePath:     environment.appInfo.apiBasePath,
    apiDomain:       environment.appInfo.apiDomain,
    websiteDomain:   environment.appInfo.websiteDomain,
    loginAppUrl:     environment.appInfo.loginAppUrl,
    consoleAppUrl:   environment.appInfo.consoleAppUrl,
  },
  localDeployment: environment.localDeployment,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOAuthCallbackPath() {
  return window.location.pathname.includes('/auth/callback/');
}

function isVerifyPath() {
  return window.location.pathname.includes('/verify');
}

// ── Animated counter (dashboard hero) ─────────────────────────────────────────
function Counter({ value, duration = 2 }: { value: number; duration?: number }) {
  const count   = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, { duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, duration, count]);

  return <motion.span>{rounded}</motion.span>;
}

// ── Provision gate — calls POST /auth/provision once after login ──────────────
// This is idempotent: safe on every login. For new orgs it creates the Supabase
// customer record and kicks off device sync. The backend resolves customer_id
// from the JWT on every subsequent request — no need to store it client-side.
//
// IMPORTANT: orgId starts as '' in AuthProvider until the session resolves.
// We must NOT render the spinner until orgId is non-empty and the provision
// call has actually been dispatched — otherwise the gate hangs forever.
function ProvisionGate({
  orgId,
  onProvisioned,
}: {
  orgId: string;
  onProvisioned: (isNew: boolean) => void;
}) {
  const http = useGtlHttp();
  const [started, setStarted] = React.useState(false);
  const [done, setDone]       = React.useState(false);

  useEffect(() => {
    if (!orgId) return;           // wait until session resolves
    setStarted(true);             // now we can show the spinner
    http.post('/auth/provision', {})
      .then((res: any) => {
        const isNew = res.data?.is_new ?? false;
        setDone(true);
        onProvisioned(isNew);
      })
      .catch((err: any) => {
        console.error('[ProvisionGate]', err);
        // Still mark done so the app doesn't hang — the backend will return
        // NOT_PROVISIONED on subsequent calls and the user can retry.
        setDone(true);
        onProvisioned(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Only block the UI while the call is in-flight (started but not done)
  if (!started || done) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
          Initialising Workspace
        </p>
      </div>
    </div>
  );
}

// ── Settings sync — loads backend settings once after provisioning ────────────
function SettingsSync() {
  const http = useGtlHttp();
  const { loadSettings } = useSettings();
  const { orgId } = useAuth();

  useEffect(() => {
    if (!orgId) return;
    // customer_id resolved from JWT by backend middleware — no need to pass it
    http.get('/settings')
      .then((res: any) => {
        const d = res.data;
        loadSettings({
          postFlightAuth: d.post_flight_auth ?? false,
          showMapVisual:  d.show_map_visual  ?? true,
          reportPrompt:   d.report_prompt    ?? '',
        });
      })
      .catch((err: any) => console.error('[SettingsSync]', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  return null;
}

// ── Dashboard content (rendered when authenticated) ───────────────────────────
function DashboardApp() {
  const { orgId } = useAuth();
  const http = useGtlHttp();

  const { activeSettings } = useSettings();
  const [activePage, setActivePage] = useState('dashboard');
  const [unit, setUnit]             = useState<'hours' | 'minutes'>('minutes');
  // In dev mode (VITE_DEV_ORG_ID set), skip provision gate — backend uses DEV_CUSTOMER_ID
  const [provisioned, setProvisioned] = useState(!!import.meta.env.VITE_DEV_ORG_ID);

  // KPI state — hero counter + orbit rings
  const [kpiData, setKpiData] = useState<{
    total_flights: number;
    avg_response_seconds: number | null;
    total_hours_saved: number;
    total_minutes_saved: number;
  } | null>(null);

  // Fetch KPIs after provisioning completes
  useEffect(() => {
    if (!provisioned) return;
    // customer_id resolved from JWT by backend middleware — no need to pass it
    http.get('/dashboard/kpis')
      .then((res: any) => setKpiData(res.data))
      .catch((err: any) => console.error('[DashboardApp KPIs]', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provisioned]);

  // Auto-switch to hours when total minutes exceed 1000
  useEffect(() => {
    if (kpiData && kpiData.total_minutes_saved > 1000) {
      setUnit('hours');
    }
  }, [kpiData]);

  const displayValue = kpiData
    ? (unit === 'hours' ? kpiData.total_hours_saved : kpiData.total_minutes_saved)
    : 0;

  const orbitKpis: OrbitKpis = {
    outer:  {
      title:    'Flight Volume',
      value:    kpiData ? kpiData.total_flights.toLocaleString() : '—',
      subtitle: 'Total Missions',
    },
    middle: {
      title:    'Avg Response',
      value:    kpiData?.avg_response_seconds != null
        ? `${kpiData.avg_response_seconds}s`
        : '—',
      subtitle: 'Seconds to Target',
    },
    inner:  {
      title:    'Hours Saved',
      value:    kpiData ? `${kpiData.total_hours_saved}h` : '—',
      subtitle: 'Total vs Car',
    },
  };

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    value: string;
    subtitle: string;
    style: 'vertical' | 'radial' | 'horizontal';
  }>({ isOpen: false, title: '', value: '', subtitle: '', style: 'vertical' });

  const handleShowMetric = (
    title: string, value: string, subtitle: string,
    style: 'vertical' | 'radial' | 'horizontal'
  ) => setModalState({ isOpen: true, title, value, subtitle, style });

  const closeModal = () => setModalState((p) => ({ ...p, isOpen: false }));

  return (
    <div className="relative min-h-screen bg-surface flex flex-col items-center overflow-x-hidden selection:bg-secondary/30 selection:text-secondary font-sans">
      {/* Provision org on login (idempotent) + sync settings once provisioned */}
      <ProvisionGate orgId={orgId} onProvisioned={(isNew) => {
        setProvisioned(true);
        if (isNew) console.log('[App] New org provisioned — device sync running in background');
      }} />
      {provisioned && <SettingsSync />}

      {/* Atmospheric gradients */}
      <div className="fixed top-0 left-0 right-0 h-[70vh] bg-gradient-to-b from-[#111111] via-[#000000] to-transparent opacity-40 pointer-events-none z-[-1]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[140%] h-[80vh] bg-[radial-gradient(circle_at_50%_0%,rgba(44,123,242,0.08),transparent_70%)] blur-3xl pointer-events-none z-[-1]" />

      <Header onNavigate={setActivePage} activePage={activePage} pfaEnabled={activeSettings.postFlightAuth} />

      {activePage !== 'dashboard' && (
        <OrbitSystem onShowMetric={handleShowMetric} onNavigate={setActivePage} mode="global" activePage={activePage} kpis={orbitKpis} />
      )}

      <AnimatePresence mode="wait">
        {activePage === 'dashboard' ? (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center w-full">
            <main className="flex-grow flex flex-col items-center justify-center p-4 mt-20">
              <div className="transform scale-[0.8] md:scale-100 flex flex-col items-center">
                <OrbitSystem onShowMetric={handleShowMetric} onNavigate={setActivePage} mode="radar" kpis={orbitKpis} />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="mt-4 md:mt-8 text-center">
                  <h2 className="font-headline font-extrabold text-3xl md:text-5xl tracking-tighter text-on-surface mb-1">First Reach</h2>
                  <p className="text-[10px] font-label uppercase tracking-[0.3em] text-primary opacity-80">Powered By FlytBase</p>
                </motion.div>
              </div>
            </main>

            <div className="relative pb-24 flex flex-col items-center w-full max-w-4xl px-6">
              <div className="flex bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-full p-1 mb-12">
                <button onClick={() => setUnit('hours')} className={`px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${unit === 'hours' ? 'bg-primary text-on-primary shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Hours Saved</button>
                <button onClick={() => setUnit('minutes')} className={`px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${unit === 'minutes' ? 'bg-primary text-on-primary shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Minutes Saved</button>
              </div>
              <motion.div key={unit} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }} className="text-center">
                <h1 className="font-headline font-black text-8xl md:text-[14rem] leading-none tracking-tighter text-on-surface drop-shadow-[0_0_60px_rgba(130,236,255,0.15)]">
                  <Counter value={displayValue} />
                </h1>
                <p className="font-label text-sm text-primary tracking-[0.6em] uppercase mt-4 opacity-60">{unit} SAVED SINCE DEPLOYMENT</p>
              </motion.div>
            </div>
          </motion.div>

        ) : activePage === 'flight-data' ? (
          <motion.div key="flight-data" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }} className="w-full pt-28 pb-10">
            <FlightDataPage />
          </motion.div>
        ) : activePage === 'statistics' ? (
          <motion.div key="statistics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }} className="w-full pt-28 pb-10">
            <StatisticsPage />
          </motion.div>
        ) : activePage === 'reports' ? (
          <motion.div key="reports" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }} className="w-full pt-28 pb-10">
            <ReportsPage />
          </motion.div>
        ) : activePage === 'post-flight-auth' ? (
          <motion.div key="post-flight-auth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }} className="w-full pt-28 pb-10">
            <PostFlightAuthPage />
          </motion.div>
        ) : activePage === 'settings' ? (
          <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }} className="w-full pt-28 pb-10">
            <SettingsPage />
          </motion.div>
        ) : (
          <motion.div key="fallback" className="flex items-center justify-center min-h-[60vh] text-on-surface/50 font-label uppercase tracking-widest">
            Page Under Development
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full h-12 flex justify-between items-center px-10 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 border-t border-white/5 bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#FA8500] animate-pulse" />
          <span>Last Sync: Live</span>
        </div>
        <span>© 2026 FlytBase Time to Target Analytics</span>
      </footer>

      <MetricModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} value={modalState.value} subtitle={modalState.subtitle} style={modalState.style} />
    </div>
  );
}

// ── Auth gate — inside providers, checks session ───────────────────────────────
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // OAuth callback — login.flytbase.com redirects back here
  if (isOAuthCallbackPath()) {
    return <GTLThirdPartyCallback />;
  }

  // Magic-link callback — user clicked link in email
  if (isVerifyPath()) {
    return <GTLPasswordlessVerification />;
  }

  // Session loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // No session → login (skip in dev mode when VITE_DEV_ORG_ID is set)
  // Auth disabled for now — dashboard always loads MPS data directly.
  // Re-enable when expanding to multiple orgs:
  // if (!isAuthenticated && !import.meta.env.VITE_DEV_ORG_ID) return <GTLLoginPage />;
  if (false) return <GTLLoginPage />;

  // Authenticated → dashboard
  return <DashboardApp />;
}

// ── Root — provider hierarchy matching IDS dashboard ──────────────────────────
export default function App() {
  // contextReady gates the app until HttpProvider has set up the HTTP client
  const [contextReady, setContextReady] = useState(false);

  return (
    <SuperTokensWrapper>
      <AuthProvider authConfig={authConfig}>
        <HttpProvider
          routerConfig={{
            setAuthContext: (_auth: AuthContextType, _httpClient: AxiosInstance) => {
              // No TanStack Router to inject into — just signal ready
              setContextReady(true);
            },
          }}
        >
          {contextReady ? (
            <AppContent />
          ) : (
            <div className="min-h-screen bg-black flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </HttpProvider>
      </AuthProvider>
    </SuperTokensWrapper>
  );
}
