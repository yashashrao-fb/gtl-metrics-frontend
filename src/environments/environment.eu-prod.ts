// Production — EU region (e.g. npcc-eu.flytbase.com)
export const environment = {
  environment: 'production-eu',
  appInfo: {
    appName: 'First Reach · GTL Dashboard',
    tenantId: 'production-eu',
    devOrgId: '', // Not needed in production — resolved from subdomain
    websiteBasePath: '/gtl-dashboard/',
    apiBasePath: '/auth',
    apiDomain: 'https://api-eu.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login-eu.flytbase.com',
    consoleAppUrl: 'https://console-eu.flytbase.com',
    accountAppUrl: 'https://account-eu.flytbase.com',
  },
  localDeployment: false,
  gtlBackendUrl: import.meta.env.VITE_GTL_BACKEND_URL ?? '',
};
