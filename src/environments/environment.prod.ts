// Production — US region (e.g. npcc.flytbase.com)
export const environment = {
  environment: 'production',
  appInfo: {
    appName: 'First Reach · GTL Dashboard',
    tenantId: 'production',
    devOrgId: '',
    websiteBasePath: '/gtl-dashboard/',
    apiBasePath: '/auth',
    apiDomain: 'https://api.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'https://login.flytbase.com',
    consoleAppUrl: 'https://console.flytbase.com',
    accountAppUrl: 'https://account.flytbase.com',
  },
  localDeployment: false,
  gtlBackendUrl: import.meta.env.VITE_GTL_BACKEND_URL ?? '',
};
