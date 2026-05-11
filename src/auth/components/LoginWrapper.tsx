import { ReactElement } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginPage from './LoginPage';
import OnPremLogin from './OnPremLogin';

/**
 * LoginWrapper component
 * Renders the appropriate login component based on deployment type
 * Similar to Angular's login-wrapper.component
 */
export default function LoginWrapper(): ReactElement {
  const { authConfig } = useAuth();

  // Check if this is a local/on-premise deployment
  const isLocalDeployment = authConfig?.localDeployment ?? false;

  // Based on deployment type, render the appropriate login component
  // This is equivalent to the Angular version's getComponentType() method
  const Component = isLocalDeployment ? OnPremLogin : LoginPage;

  return <Component />;
}
