import { useContext } from 'react';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';
import { AuthContext } from '../providers/AuthProvider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const session = useSessionContext();
  const isAuthenticated = session.loading === false && session.doesSessionExist === true;

  return {
    ...context,
    session,
    isAuthenticated,
    isLoading: session.loading,
  };
}
