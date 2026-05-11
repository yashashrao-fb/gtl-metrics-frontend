import '../styles/auth.css';
import { useAuth } from '../hooks/useAuth';
import Footer from './Footer';

/**
 * NoSitesAvailablePage - Displays when a user doesn't have access to any sites.
 * Provides options to navigate to operations console for site assignment.
 */
export default function NoSitesAvailablePage() {
  const { authConfig } = useAuth();

  const routeToConsole = () => {
    window.location.href = authConfig.appInfo.consoleAppUrl ?? '';
  };

  return (
    <section className="w-screen h-screen bg-neutral-900 flex flex-col justify-center items-center">
      <div className="text-center flex-1 flex flex-col items-center justify-center">
        <img
          src="assets/flytbase-logo.svg"
          alt="FlytBase Logo"
          className="mb-8"
        />
        <div className="text-text-1 text-2xl font-medium">
          No Sites Available
        </div>
        <div className="max-w-[345px] mt-4 space-y-8">
          <div className="text-gray-300 text-base">
            You don't have access to any sites yet. Please contact your
            administrator.
          </div>
          <div>
            <button
              onClick={routeToConsole}
              className="px-6 py-2 bg-blue-400 hover:bg-blue-500 text-zinc-900 font-medium rounded transition w-full"
            >
              Go to Console
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
}
