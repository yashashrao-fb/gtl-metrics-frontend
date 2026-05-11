// Local development — runs against the FlytBase dev API
export const environment = {
  environment: 'development',
  appInfo: {
    appName: 'First Reach · GTL Dashboard',
    tenantId: 'development',
    devOrgId: '68edfa4d56b0eedad4f01854', // Shared FlytBase dev org
    websiteBasePath: '/',
    apiBasePath: '/auth',
    apiDomain: 'https://api-dev.flytbase.com',
    websiteDomain: window.location.origin,
    loginAppUrl: 'http://localhost:4006',
    consoleAppUrl: 'http://localhost:4002',
    accountAppUrl: 'http://localhost:4004',
  },
  localDeployment: false,
  gtlBackendUrl: import.meta.env.VITE_GTL_BACKEND_URL ?? 'http://localhost:3001',
};
