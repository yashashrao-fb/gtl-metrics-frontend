import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';

/**
 * SuperAdminRestrictedPage - Displays a restricted access message when users try to access super-admin-only routes.
 * Simplified to match the Angular implementation.
 */
export default function RestrictedPage() {
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    // Navigate to login is handled internally by logout
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      <div className="flex justify-end px-4 py-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-transparent text-text-1 border border-gray-600 rounded hover:bg-neutral-800"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-grow -mt-15">
        <div>
          <img
            src="assets/flytbase-logo.svg"
            alt="FlytBase Logo"
            width="224"
            height="56"
          />
        </div>
        <div className="flex items-center gap-4 text-text-1 text-[24px] text-center mt-3">
          <span>This page is restricted</span>
        </div>
      </div>
    </div>
  );
}
