/**
 * Feature Guard - Route-Level Feature Flag Validation
 *
 * Checks if an organization has access to a specific feature.
 * Used in beforeLoad for route protection.
 *
 * Flow:
 * 1. Check if development mode (bypass feature check)
 * 2. Fetch organization config via HTTP client
 * 3. Validate feature flag is enabled
 * 4. Redirect to /feature-not-enabled if disabled
 *
 * Usage:
 * ```typescript
 * // In route beforeLoad
 * const layoutLoader = async ({ context }: any) => {
 *   await requireFeature(context, FeatureFlag.AssetManagement);
 * };
 * ```
 */

import { redirect } from '@tanstack/react-router';
import { FeatureFlag, GloballyReleasedFeatures } from '@libs/shared/types';
import { GuardContext } from './types';

/**
 * Require Feature Guard
 *
 * Validates that the organization has access to a specific feature.
 * Throws redirect if feature is not enabled.
 *
 * @param context - Router context with auth and http
 * @param featureFlag - Optional feature flag to check (e.g., FeatureFlag.AssetManagement)
 *                      If undefined, skips feature validation (app open to all orgs)
 * @throws Redirect to /restricted if feature disabled
 *
 * @example
 * ```typescript
 * // Asset Management layout - with feature check
 * const layoutLoader = async ({ context }: any) => {
 *   await requireAuth(context.auth);
 *   await requireOrg(context.auth);
 *   await requireFeature(context, FeatureFlag.AssetManagement);
 * };
 *
 * // Fleet layout - with feature check
 * await requireFeature(context, FeatureFlag.FleetV2);
 *
 * // Mission Planner - no feature check (open to all orgs)
 * await requireFeature(context); // No feature flag = skip validation
 * // Or simply don't call requireFeature at all
 * ```
 */
export const requireFeature = async (
  context: GuardContext,
  featureFlag?: FeatureFlag
): Promise<void> => {
  try {
    // Skip feature validation if no feature flag provided
    // This allows apps to be accessible to all organizations without feature checks
    if (!featureFlag) {
      console.log(
        '[requireFeature] No feature flag provided - skipping feature validation'
      );
      return;
    }

    // Ensure HTTP client is available
    if (!context.httpClient) {
      console.error('[requireFeature] HTTP client not available in context');
      throw redirect({ to: '/restricted' });
    }

    // Fetch Organization Config
    // This API call returns organization features configuration
    const response = await context.httpClient.get(
      '/organization/entitlements/fetch'
    );
    const config = response?.data;

    if (!config || !config.features) {
      console.warn('[requireFeature] No features found in org config');
      throw redirect({ to: '/restricted' });
    }

    // Check Feature Flag
    let isFeatureEnabled = false;

    if (GloballyReleasedFeatures.includes(featureFlag)) {
      isFeatureEnabled = true;
    } else {
      // Find the feature in config and validate it's enabled
      const feature = config.features.find((f: any) => f.name === featureFlag);
      isFeatureEnabled = feature?.value === true;
    }

    // Development Mode Bypass
    // Auto-detect development mode and skip feature checks
    if (!isFeatureEnabled && !import.meta.env.DEV) {
      console.warn(
        `[requireFeature] Feature ${featureFlag} is not enabled for this organization`
      );
      throw redirect({ to: '/restricted' });
    }

    // Feature enabled - allow access
    console.log(
      `[requireFeature] Feature ${featureFlag} validated successfully`
    );
  } catch (error: any) {
    console.error(
      `[requireFeature] Feature check failed for ${featureFlag}:`,
      error
    );

    // If error is already a redirect, re-throw it
    if (error.isRedirect) {
      throw error;
    }

    // On any other error, deny access
    throw redirect({ to: '/restricted' });
  }
};
