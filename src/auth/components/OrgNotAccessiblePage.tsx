import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import '../styles/auth.css';
import { useAuth } from '../hooks/useAuth';
import { OrgCheckState } from '../types';
import Footer from './Footer';

/**
 * OrganizationNotAccessiblePage - Displays when a user tries to access a non-existent or unavailable organization.
 * Matches the Angular implementation.
 */
export default function OrgNotAccessiblePage() {
  const navigate = useNavigate();
  const { checkCurrentOrgInMap, authConfig } = useAuth();

  useEffect(() => {
    const checkOrg = async () => {
      const isUserInOrg = await checkCurrentOrgInMap();
      if (isUserInOrg === OrgCheckState.ORGANIZATION_FOUND) {
        navigate({ to: '/' });
      }
    };

    checkOrg();
  }, [checkCurrentOrgInMap, navigate]);

  const routeToAdmin = () => {
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
          Organization Not Accessible
        </div>
        <div className="max-w-[345px] mt-4 space-y-8">
          <div className="text-gray-300 text-base">
            The organization you are trying to access is not available or you
            don't have permission to access it. Please check the URL or go to
            'My Organizations'
          </div>
          <div>
            <button
              onClick={routeToAdmin}
              className="px-6 py-2 bg-blue-400 hover:bg-blue-500 text-zinc-900 font-medium rounded transition w-full"
            >
              My Organizations
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
}
