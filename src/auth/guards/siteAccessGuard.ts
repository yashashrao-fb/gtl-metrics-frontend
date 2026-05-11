import { redirect, isRedirect } from '@tanstack/react-router';
import { GuardFunction } from './types';

/**
 * Configuration for site access guard
 */
export interface SiteAccessGuardConfig {
  /**
   * API endpoint to fetch sites list
   * @example 'sites/' or '/api/sites'
   */
  sitesEndpoint: string;
  /**
   * Route to redirect to when no sites available
   * @default '/no-sites'
   */
  noSitesRoute?: string;
}

/**
 * Creates a site access guard that checks if user has access to any sites
 * Follows the same pattern as orgGuard - uses httpClient from GuardContext
 *
 * @param config Configuration for the guard
 * @returns A guard function that can be used with combineGuardFunctions
 *
 * @example
 * ```typescript
 * // In _layout.tsx
 * const requireSiteAccess = createSiteAccessGuard({
 *   sitesEndpoint: 'sites/',
 *   noSitesRoute: '/no-sites',
 * });
 *
 * const layoutGuard = combineGuardFunctions(
 *   requireAuth,
 *   requireOrg,
 *   requireSiteAccess
 * );
 * ```
 */
export const createSiteAccessGuard = (
  config: SiteAccessGuardConfig
): GuardFunction => {
  const { sitesEndpoint, noSitesRoute = '/no-sites' } = config;

  const siteAccessGuard: GuardFunction = async (context) => {
    const { httpClient } = context;

    try {
      if (!httpClient) {
        console.error('[SiteAccessGuard] Error: httpClient not available!');
        return;
      }

      const response = await httpClient.get(sitesEndpoint);
      const sites = response.data || [];

      if (!Array.isArray(sites) || sites.length === 0) {
        throw redirect({ to: noSitesRoute });
      }
    } catch (error: any) {
      if (isRedirect(error)) {
        throw error;
      }
      console.error('[SiteAccessGuard] Error: Non-redirect error:', error);
    }
  };

  return siteAccessGuard;
};
