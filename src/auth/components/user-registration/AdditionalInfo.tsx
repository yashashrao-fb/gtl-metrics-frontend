import { useState, useEffect } from 'react';
import { useHttp } from '../../hooks/useHttp';
import { useForm, Controller } from 'react-hook-form';

// Define types based on the Angular component
interface CountryOption {
  title: string;
  value: string;
}

interface BusinessModel {
  value: string;
  viewValue: string;
}

interface AdditionalInfo {
  country?: string;
  company?: string;
  business_models?: string[];
}

// Country codes utility function
const getCountryCodes = async (): Promise<CountryOption[]> => {
  // Using a CDN to load country data (alternative to using the country-codes-list package)
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    const data = await response.json();

    // Format countries similar to the Angular component
    const formattedCountries = data.map((country: any) => ({
      title: country.name.common,
      value: country.name.common,
    }));

    // Sort by country name
    return formattedCountries.sort((a: CountryOption, b: CountryOption) =>
      a.title.localeCompare(b.title)
    );
  } catch (error) {
    console.error('Error fetching country data:', error);
    return [];
  }
};

/**
 * Additional Info component for the user registration flow.
 * Collects additional user information like country, company and business model.
 */
export default function AdditionalInfo() {
  const http = useHttp();
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [showOtherBusinessModel, setShowOtherBusinessModel] = useState(false);
  const [finishLoader, setFinishLoader] = useState(false);

  // Business models - same as in Angular version
  const businessModels: BusinessModel[] = [
    { value: 'Drone solution provider', viewValue: 'Drone solution provider' },
    { value: 'Drone dealer/reseller', viewValue: 'Drone dealer/reseller' },
    { value: 'Enterprise drone user', viewValue: 'Enterprise drone user' },
    { value: 'System integrator', viewValue: 'System integrator' },
    { value: 'other', viewValue: 'Other' },
  ];

  // Set up the form with react-hook-form
  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm({
    defaultValues: {
      company: '',
      country: '',
      businessModel: [] as string[],
      otherBusinessModel: '',
    },
  });

  // Watch form values to trigger UI updates
  const selectedBusinessModels = watch('businessModel');
  const otherBusinessModelValue = watch('otherBusinessModel');

  // Load country options on component mount
  useEffect(() => {
    loadCountryNames();
    // Optional: Fetch profile data if needed
    fetchProfileData();
  }, []);

  // Check if "other" is selected in business models
  useEffect(() => {
    if (selectedBusinessModels && selectedBusinessModels.includes('other')) {
      setShowOtherBusinessModel(true);
    } else {
      setShowOtherBusinessModel(false);
    }
  }, [selectedBusinessModels]);

  // Load country names
  const loadCountryNames = async () => {
    const countries = await getCountryCodes();
    setCountryOptions(countries);
  };

  // Fetch profile data
  const fetchProfileData = async () => {
    try {
      const response = await http.get('/v2/user/profile');
      // TODO: Handle profile data when needed
      if (response.data) {
        console.log('Profile data loaded:', response.data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  // Handle business model selection change
  const onBusinessModelChange = (selectedValues: string[]) => {
    if (selectedValues.includes('other')) {
      setShowOtherBusinessModel(true);
    } else {
      setShowOtherBusinessModel(false);
    }
  };

  // Go back to previous page
  const onBack = () => {
    window.history.back();
  };

  // Skip this step
  const onSkip = () => {
    acknowledgePolicy();
  };

  // Submit the form
  const onFinish = handleSubmit((data) => {
    setFinishLoader(true);

    // Prepare the additional info data
    const additionalInfo: AdditionalInfo = {};

    additionalInfo.country = data.country || '';
    additionalInfo.company = data.company || '';

    // Process business models
    if (Array.isArray(data.businessModel) && data.businessModel.length > 0) {
      let businessModels = data.businessModel.map((model) => model.trim());

      if (businessModels.includes('other')) {
        const trimmedOther = data.otherBusinessModel
          ? data.otherBusinessModel.trim()
          : '';

        if (trimmedOther) {
          businessModels.push(trimmedOther);
        }
        businessModels = businessModels.filter((model) => model !== 'other');
      }

      additionalInfo.business_models = businessModels;
    }

    // Update profile with additional info
    http
      .put('/v2/user/profile/additional_info', additionalInfo)
      .then(() => {
        acknowledgePolicy();
      })
      .catch((error) => {
        console.error('Error updating additional info:', error);
        setFinishLoader(false);
      });
  });

  // Acknowledge policy and complete registration
  const acknowledgePolicy = () => {
    http
      .put('/v2/user/profile/acknowledge_policy', { view_policy_page: false })
      .then(() => {
        setFinishLoader(false);
        // Reload page to apply changes - same as Angular version
        window.location.reload();
      })
      .catch((error) => {
        console.error('Error acknowledging policy:', error);
        setFinishLoader(false);
      });
  };

  // Check if character limit is exceeded
  const isMaxLengthExceeded = () => {
    return otherBusinessModelValue && otherBusinessModelValue.length >= 200;
  };

  return (
    <div className="px-[72px] pt-[128px] pb-[72px] h-full flex flex-col justify-between">
      <div className="w-[176px] h-[52px] mb-13">
        <img
          src="assets/flytbase-logo.svg"
          alt="FlytBase Logo"
          className="h-13"
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
      <div className="h-full flex flex-col pt-13">
        <section>
          <div className="pb-7 text-2xl font-semibold text-text-1">
            Tell us about yourself
          </div>
          <form className="h-full flex flex-col justify-between">
            <div className="space-y-8">
              {/* Country Select */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Country
                </label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full p-2 bg-transparent border border-gray-600 rounded text-text-1 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select a country</option>
                      {countryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.title}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Company Input */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Company
                </label>
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Company Name"
                      className="w-full p-2 bg-transparent border border-gray-600 rounded text-text-1 focus:outline-none focus:border-blue-500"
                    />
                  )}
                />
              </div>

              {/* Business Model Selection */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Business Model
                </label>
                <Controller
                  name="businessModel"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {businessModels.map((model) => (
                        <div key={model.value} className="mb-2">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="form-checkbox h-5 w-5 text-blue-600"
                              value={model.value}
                              checked={field.value.includes(model.value)}
                              onChange={(e) => {
                                const selectedValue = model.value;
                                const newValues = e.target.checked
                                  ? [...field.value, selectedValue]
                                  : field.value.filter(
                                      (v) => v !== selectedValue
                                    );

                                field.onChange(newValues);
                                onBusinessModelChange(newValues);
                              }}
                            />
                            <span className="ml-2 text-text-1">
                              {model.viewValue}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Other Business Model Textarea (conditional) */}
              {showOtherBusinessModel && (
                <div>
                  <Controller
                    name="otherBusinessModel"
                    control={control}
                    render={({ field }) => (
                      <>
                        <textarea
                          {...field}
                          placeholder="Please specify your business model"
                          className="w-full p-2 bg-transparent border border-gray-600 rounded text-text-1 focus:outline-none focus:border-blue-500"
                          maxLength={200}
                          rows={4}
                        />
                        <div
                          className={`text-right text-sm ${
                            isMaxLengthExceeded()
                              ? 'text-red-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {field.value.length}/200 characters
                        </div>
                      </>
                    )}
                  />
                </div>
              )}
            </div>
          </form>
        </section>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          className="bg-transparent border border-gray-600 text-text-1 px-4 py-2 rounded hover:bg-gray-800 transition duration-200"
          onClick={onBack}
        >
          Back
        </button>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="text-text-1 hover:text-gray-300 transition duration-200"
            onClick={onSkip}
          >
            Skip
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded transition duration-200 ${
              isValid
                ? 'bg-blue-500 hover:bg-blue-600 text-text-1'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
            disabled={!isValid || finishLoader}
            onClick={onFinish}
          >
            {finishLoader ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Finish</span>
              </div>
            ) : (
              'Finish'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
