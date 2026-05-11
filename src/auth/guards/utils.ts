import { GuardContext, GuardFunction, RouteLoaderContext } from './types';

/**
 * Helper to create a loader function that doesn't require hooks
 * This can be used in TanStack Router's beforeLoad
 */
export const createRouteLoader = (guardFn: GuardFunction) => {
  return async ({ context }: RouteLoaderContext) => {
    // The auth context is passed through the router context
    const { auth, httpClient } = context;

    if (!auth) {
      throw new Error('Auth context not available in router context');
    }

    // Create a guard context with auth and optionally http
    const guardContext: GuardContext = httpClient
      ? { ...auth, httpClient }
      : auth;

    try {
      // Call the guard with the auth context
      await guardFn(guardContext);
    } catch (error: any) {
      // Check for redirect
      if (error && error.isRedirect) {
        throw error; // Re-throw to let TanStack Router handle it
      }
      throw error; // Re-throw other errors
    }
  };
};

/**
 * HOC pattern - Higher-order component pattern for combining multiple route guards
 * For use with component-based routes
 * @deprecated Use combineGuardFunctions for route loaders
 */
export const combineGuards = (...guards: Array<() => Promise<void>>) => {
  return async () => {
    for (const guard of guards) {
      await guard();
    }
  };
};

/**
 * Combines multiple guard functions into a single guard function
 * This version is compatible with createRouteLoader and works with TanStack Router's beforeLoad
 *
 * @example
 * // Create a combined guard for route protection
 * const protectedGuard = combineGuardFunctions(requireAuth, requireOrg);
 *
 * // Use with createRouteLoader
 * beforeLoad: createRouteLoader(protectedGuard)
 */
/**
 * Combines multiple guard functions into a single guard function,
 * properly propagating redirects and errors.
 */
export const combineGuardFunctions = (
  ...guardFns: Array<GuardFunction>
): GuardFunction => {
  return async (context: GuardContext, ...args: any[]) => {
    for (const guardFn of guardFns) {
      await guardFn(context, ...args);
    }
  };
};

/**
 * Helper to create guard with auth context
 * This helps bridge the functional guards to the component world
 * @deprecated Use createRouteLoader instead for TanStack Router
 */
export const createGuard = (
  guardFn: GuardFunction,
  authContext: GuardContext,
  extraArgs: any[] = []
) => {
  return async () => {
    return guardFn(authContext, ...extraArgs);
  };
};

/**
 * Waits for HttpProvider to set auth context in router
 * Used for HMR safety where router can reload before HttpProvider effect runs
 *
 * @private Internal helper for createLayoutGuardLoader
 */
async function waitForAuthContext(
  router: any,
  timeoutMs = 5000
): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 100;

  return new Promise((resolve, reject) => {
    const checkContext = () => {
      // Check LIVE router context (updated by HttpProvider)
      if (
        (router.options as RouteLoaderContext).context.auth &&
        (router.options as RouteLoaderContext).context.httpClient
      ) {
        console.log('[waitForAuthContext] Auth context ready');
        resolve();
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        reject(
          new Error(`Timeout after ${timeoutMs}ms waiting for auth context`)
        );
        return;
      }

      setTimeout(checkContext, pollInterval);
    };

    checkContext();
  });
}

/**
 * Creates a beforeLoad function for layout routes with HMR safety
 *
 * Handles:
 * - HMR safety: Waits for auth context if not immediately available (dev only)
 * - Fresh context: Uses live router context to avoid stale snapshots
 * - Guard execution: Runs provided guards with proper context
 *
 * @param guardFn - Combined guard function to execute
 * @param router - Router instance from app
 * @returns beforeLoad function ready for TanStack Router
 *
 * @example
 * ```typescript
 * const layoutGuard = combineGuardFunctions(
 *   requireAuth,
 *   requireOrg,
 *   async (ctx) => requireFeature(ctx, FeatureFlag.AssetManagement)
 * );
 *
 * export const Route = createFileRoute('/_layout')({
 *   component: LayoutRoute,
 *   beforeLoad: createLayoutGuardLoader(layoutGuard, router),
 * });
 * ```
 */
export const createLayoutGuardLoader = (
  guardFn: GuardFunction,
  router: any
) => {
  return async (loaderContext: RouteLoaderContext) => {
    let effectiveContext = loaderContext;

    // HMR Safety (Development Only)
    if (import.meta.env.DEV) {
      // Wait if context not ready (HMR edge case)
      if (
        !(router.options as RouteLoaderContext).context.auth ||
        !(router.options as RouteLoaderContext).context.httpClient
      ) {
        console.log(
          '[createLayoutGuardLoader] Auth context not ready, waiting...'
        );
        await waitForAuthContext(router);
      }

      // Always use fresh router context in dev (prevents stale snapshots from HMR)
      effectiveContext = {
        ...loaderContext,
        context: (router.options as RouteLoaderContext).context,
      };
    }

    // Execute guards with effective context
    const guardLoader = createRouteLoader(guardFn);
    await guardLoader(effectiveContext);
  };
};
