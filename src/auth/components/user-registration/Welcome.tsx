import { useNavigate } from '@tanstack/react-router';

/**
 * Welcome component for the user registration flow.
 * This is the first step in the user registration process.
 * It displays a welcome message and a button to get started.
 */
export function WelcomeComponent() {
  const navigate = useNavigate();

  const onGetStarted = () => {
    navigate({ to: '/user-registration/terms' });
  };

  return (
    <div className="px-16 md:px-18 pt-24 pb-10 h-full flex flex-col justify-between">
      <div className="flex-1">
        <div className="w-44 h-13 mb-12">
          <img
            src="assets/flytbase-logo.svg"
            alt="FlytBase Logo"
            className="h-12"
            onError={(e) => {
              // Fallback text if logo doesn't load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const textNode = document.createElement('div');
                textNode.textContent = 'FlytBase';
                textNode.className = 'text-text-1 text-3xl font-semibold';
                parent.appendChild(textNode);
              }
            }}
          />
        </div>
        <div className="text-text-1 pb-7 text-2xl font-semibold">
          Welcome to FlytBase
        </div>
        <div className="text-gray-400 pb-7 text-base">
          Experience the future of drone autonomy with FlytBase. Efficiently
          manage and control your drone fleet, automating complex workflows with
          ease.
        </div>
        <div className="text-gray-400 text-base">
          Let's get started on optimizing your drone operations!
        </div>
      </div>
      <div>
        <div className="flex justify-end">
          <button
            onClick={onGetStarted}
            className="bg-blue-400 hover:bg-blue-500 text-zinc-900 font-medium py-2 px-4 rounded transition duration-200"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeComponent;
