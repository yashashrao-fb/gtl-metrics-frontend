import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

/**
 * Terms component for the user registration flow.
 * This is the step where users review and acknowledge the terms and privacy policy.
 */
export function TermsComponent() {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(false);

  const onCheckboxStateChanged = (checked: boolean) => {
    setIsChecked(checked);
  };

  const onBack = () => {
    // Navigate back to the previous page
    window.history.back();
  };

  const onContinue = () => {
    // Only proceed if terms are accepted
    if (isChecked) {
      navigate({ to: '/user-registration/register' });
    }
  };

  const onAcknowledgeTextClick = () => {
    // Toggle checkbox when text is clicked
    const newValue = !isChecked;
    setIsChecked(newValue);
    onCheckboxStateChanged(newValue);
  };

  return (
    <div className="px-[72px] pt-[128px] pb-[72px] h-full flex flex-col justify-between">
      <div>
        <div className="w-[176px] h-[52px] mb-14">
          <img
            src="assets/flytbase-logo.svg"
            alt="FlytBase Logo"
            className="h-13"
          />
        </div>
        <div className="text-text-1 pb-7">
          Review and acknowledge FlytBase’s Privacy Policy and Terms of use
        </div>
        <div className="text-gray-400 text-base">
          Your privacy is important to us. Please review our{' '}
          <a
            href="https://www.flytbase.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://www.flytbase.com/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            Terms and Conditions
          </a>{' '}
          to understand how we collect, use, and protect your data.
        </div>
      </div>
      <div>
        <div className="flex pb-5 items-center">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onCheckboxStateChanged(e.target.checked)}
            className="h-5 w-5 text-blue-600 bg-transparent rounded border-gray-400 focus:ring-blue-500"
          />
          <span
            className="cursor-pointer  pl-2 text-gray-300"
            onClick={onAcknowledgeTextClick}
          >
            I acknowledge that I have read and agree to the terms and conditions
          </span>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="bg-transparent border border-gray-600 text-text-1 px-4 py-2 rounded hover:bg-gray-800 transition duration-200"
          >
            Back
          </button>
          <button
            onClick={onContinue}
            disabled={!isChecked}
            className={`px-4 py-2 rounded transition duration-200 ${
              isChecked
                ? 'bg-blue-400 hover:bg-blue-500 text-zinc-900'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsComponent;
