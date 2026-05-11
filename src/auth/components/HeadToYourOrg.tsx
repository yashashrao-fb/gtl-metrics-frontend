import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import Session from 'supertokens-auth-react/recipe/session';
import '../styles/auth.css';
import Footer from './Footer';
import { OrgCheckState } from '../types';

interface HeadToYourOrgProps {
  onNavigate?: (path: string) => void;
  logoUrl?: string;
}

export default function HeadToYourOrg({
  onNavigate,
  logoUrl,
}: HeadToYourOrgProps) {
  const navigate = useNavigate();
  const { authConfig, checkCurrentOrgInMap } = useAuth();
  const defaultLogo = 'assets/flytbase-logo.svg';

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (path.startsWith('http')) {
      // For external URLs
      window.location.href = path;
    } else {
      navigate({ to: path });
    }
  };

  useEffect(() => {
    const checkOrganization = async () => {
      try {
        const orgStatus = await checkCurrentOrgInMap();

        if (orgStatus === OrgCheckState.ORGANIZATION_FOUND) {
          // If organization is found, navigate to root
          handleNavigation('/');
        }
      } catch (error) {
        console.error('Error checking organization:', error);
      }
    };

    checkOrganization();
  }, []);

  const routeToAdmin = () => {
    // Navigate to admin portal
    // This assumes you have configured the admin URL in your environment
    const adminUrl = authConfig?.appInfo?.loginAppUrl || '/login';
    window.location.href = adminUrl;
  };

  const logout = async () => {
    try {
      await Session.signOut();
      const loginUrl = authConfig?.appInfo?.loginAppUrl || '/login';
      handleNavigation(loginUrl);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      <div className="flex justify-between px-11 py-7">
        <img src={logoUrl || defaultLogo} alt="Logo" className="h-10" />
        <button
          onClick={logout}
          className="border border-neutral-700 bg-transparent text-text-1 px-4 py-2 rounded hover:bg-neutral-800"
        >
          Logout
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-2xl text-text-1 font-bold">
          Welcome to FlytBase
        </div>
        <div className="text-4xl text-text-1 font-bold mt-2">
          Head to your Organization
        </div>
        <div className="mt-8">
          <button
            onClick={routeToAdmin}
            className="bg-blue-600 hover:bg-blue-700 text-text-1 px-10 py-2 rounded text-base"
          >
            My Organizations
          </button>
        </div>
      </div>

      <div className="text-center py-8 text-neutral-400">
        Need help?{' '}
        <a href="mailto:support@flytbase.com" className="text-text-1">
          support@flytbase.com
        </a>
      </div>
      <Footer />
    </div>
  );
}
