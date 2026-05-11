/**
 * Type stubs for modules used inside auth-export that are not
 * installed in this project. We never call these directly — the
 * components that use them (LoginPage, guards, etc.) are part of
 * the auth-export library but not consumed by this app.
 */

declare module '@libs/shared/types' {
  export type FeatureFlag = string;
  // Used as a value (array) in featureGuard — must be a const, not just a type
  export const GloballyReleasedFeatures: readonly string[];
}
