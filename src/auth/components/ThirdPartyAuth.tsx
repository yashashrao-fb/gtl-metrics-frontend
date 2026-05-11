import { useState } from 'react';
import { redirectToThirdPartyLogin } from '../config/SuperTokensConfig';
import { THIRD_PARTY_IDS } from '../types';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';

// SSO Provider configurations - created once at module load
const SSO_PROVIDERS = [
  {
    id: THIRD_PARTY_IDS.GOOGLE,
    name: 'Google',
    icon: 'google',
  },
  {
    id: THIRD_PARTY_IDS.MICROSOFT,
    name: 'Microsoft',
    icon: 'microsoft',
  },
] as const;

export default function ThirdPartyAuth() {
  const [isLoading, setIsLoading] = useState<THIRD_PARTY_IDS | null>(null);
  const { authConfig } = useAuth();

  // Determine which SSO providers to show based on websiteBasePath
  const getEnabledProviders = (): THIRD_PARTY_IDS[] => {
    const websiteBasePath = authConfig?.appInfo?.websiteBasePath;

    // Non-dock app only gets Microsoft
    if (websiteBasePath?.includes('/non-dock/')) {
      return [THIRD_PARTY_IDS.MICROSOFT];
    }

    // All other apps get both providers (default)
    return [THIRD_PARTY_IDS.GOOGLE, THIRD_PARTY_IDS.MICROSOFT];
  };

  const enabledProviders = getEnabledProviders();

  // Generic handler for any SSO provider
  const handleProviderSignIn = async (providerId: THIRD_PARTY_IDS) => {
    try {
      setIsLoading(providerId);
      await redirectToThirdPartyLogin(providerId);
    } catch (error) {
      console.error(`Error during ${providerId} sign-in:`, error);
      setIsLoading(null);
    }
  };

  // Filter providers based on what's enabled for this app
  const visibleProviders = SSO_PROVIDERS.filter((provider) =>
    enabledProviders.includes(provider.id)
  );

  return (
    <div className="flex flex-row gap-3 lg:flex-col lg:gap-4">
      {visibleProviders.map((provider) => (
        <button
          key={provider.id}
          onClick={() => handleProviderSignIn(provider.id)}
          disabled={isLoading !== null}
          className="flex items-center flex-1 lg:w-full p-3 rounded border border-neutral-600 bg-neutral-800 text-text-1"
          aria-label={`Sign in with ${provider.name}`}
        >
          <div className="auth-social-icon mr-3">
            <img
              src={`assets/${provider.icon}-icon.svg`}
              onError={(e) => {
                e.currentTarget.src = `assets/icons/login/${provider.icon}-icon.svg`;
              }}
              alt={provider.name}
            />
          </div>
          <span className="flex-1 text-center text-sm lg:text-base -ml-6">
            {isLoading === provider.id ? (
              'Connecting...'
            ) : (
              <>
                <span className="lg:hidden">{provider.name}</span>
                <span className="hidden lg:inline">
                  Continue with {provider.name}
                </span>
              </>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
