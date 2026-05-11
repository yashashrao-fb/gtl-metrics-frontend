import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Logout = () => {
  const { logout, authConfig } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      await logout();

      // Redirect to login
      const loginUrl = authConfig?.appInfo?.loginAppUrl;
      const basePath = authConfig?.appInfo?.websiteBasePath || '/';

      // For localhost and Lovable deployments, stay on same domain
      // For production domains, redirect to loginAppUrl
      const isLocalOrLovable = [
        '.localhost',
        '.lovable.app',
        '.lovableproject.com',
      ].some((host) => window.location.origin.includes(host));

      if (loginUrl && !isLocalOrLovable) {
        window.location.href = loginUrl;
      } else {
        window.location.href = `${basePath}login`;
      }
    };
    performLogout();
  }, [logout, authConfig]);

  return null;
};

export default Logout;
