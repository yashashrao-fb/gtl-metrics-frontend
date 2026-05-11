/**
 * Runtime environment selector — mirrors the IDS dashboard pattern exactly.
 * All configs are bundled; the right one is selected from the hostname before React mounts.
 *
 * Patterns:
 *   EU production  →  *-eu.flytbase.com
 *   US production  →  *.flytbase.com  (no -eu / -stag suffix)
 *   Local dev      →  localhost / 127.0.0.1 / anything else
 */

import { environment as devConfig }    from './environment.dev';
import { environment as prodConfig }   from './environment.prod';
import { environment as euProdConfig } from './environment.eu-prod';

function detectEnvironment() {
  const hostname = window.location.hostname;

  if (hostname.includes('-eu.flytbase.com')) return euProdConfig;
  if (hostname.includes('flytbase.com') && !hostname.includes('-stag')) return prodConfig;

  // localhost, 127.0.0.1, or any unknown host → dev
  return devConfig;
}

export const environment = detectEnvironment();
