import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useHttp } from '../../hooks/useHttp';
import { useForm, Controller } from 'react-hook-form';

// Define ProfileData interface to match the Angular version
interface PhoneDetails {
  number?: string;
  country_code?: string;
}

interface ProfileData {
  name?: string;
  first_name?: string;
  last_name?: string;
  phone_details?: PhoneDetails;
  profile_image_url?: string;
}

/**
 * Register component for the user registration flow.
 * Collects basic user information like name, phone, and profile picture.
 */
export function Register() {
  const navigate = useNavigate();
  const http = useHttp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(false);
  const [isPhoneInvalid, setIsPhoneInvalid] = useState(false);
  const [registrationButtonLoader, setRegistrationButtonLoader] =
    useState(false);
  const defaultImageUrl = 'assets/profile_picture.svg';

  // Set up the form with react-hook-form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<ProfileData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      phone_details: {
        number: '',
        country_code: '',
      },
      profile_image_url: defaultImageUrl,
    },
    mode: 'onChange',
  });

  // Watch phone details to validate
  const phoneDetails = watch('phone_details');
  const profileImageUrl = watch('profile_image_url');

  // Load profile data on component mount
  useEffect(() => {
    fetchProfileData();
    if (phoneDetails) {
      setIsPhoneInvalid(checkPhoneDetailsValidity(phoneDetails));
    }
  }, []);

  // Validate phone details when they change
  useEffect(() => {
    if (phoneDetails) {
      setIsPhoneInvalid(checkPhoneDetailsValidity(phoneDetails));
    }
  }, [phoneDetails]);

  const fetchProfileData = async () => {
    try {
      const response = await http.get('/v2/user/profile');
      if (response.data) {
        clearErrors();
        updateFormWithProfileData(response.data.data);
        setProfileData(response.data.data);
        if (phoneDetails) {
          setIsPhoneInvalid(checkPhoneDetailsValidity(phoneDetails));
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const updateFormWithProfileData = (profile: ProfileData) => {
    const currentFirstName = watch('first_name');
    const currentLastName = watch('last_name');
    const currentPhoneNumber = watch('phone_details.number');
    const currentCountryCode = watch('phone_details.country_code');

    setValue('first_name', currentFirstName || profile.first_name || '');
    setValue('last_name', currentLastName || profile.last_name || '');
    setValue(
      'phone_details.number',
      currentPhoneNumber || profile.phone_details?.number || ''
    );
    setValue(
      'phone_details.country_code',
      currentCountryCode || profile.phone_details?.country_code || ''
    );
    setValue('profile_image_url', profile.profile_image_url || defaultImageUrl);
  };

  // Handle file input change for profile picture
  const fileChanged = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      event.target.value = '';

      setIsProfileImageLoading(true);

      // Create FormData to upload the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload profile picture
      http
        .put('/v2/user/profile/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((response) => {
          // Update profile image URL in form
          if (
            response.data &&
            response.data.data &&
            response.data.data.profile_image_url
          ) {
            setValue('profile_image_url', response.data.data.profile_image_url);
          }
          setIsProfileImageLoading(false);
        })
        .catch((error) => {
          console.error('Error uploading profile picture:', error);
          setIsProfileImageLoading(false);
        });
    }
  };

  const removeProfilePicture = () => {
    setIsProfileImageLoading(true);

    http
      .delete('/v2/user/profile/image')
      .then(() => {
        setValue('profile_image_url', defaultImageUrl);
        setIsProfileImageLoading(false);
      })
      .catch((error) => {
        console.error('Error removing profile picture:', error);
        setIsProfileImageLoading(false);
      });
  };

  // Submit form data
  const onContinue = handleSubmit((data) => {
    if (!isValid || isPhoneInvalid) {
      return;
    }

    setRegistrationButtonLoader(true);
    const dataToUpdate: Partial<ProfileData> = {};

    // Build full name from first and last name
    const newFullName = `${data.first_name || ''} ${
      data.last_name || ''
    }`.trim();

    if (newFullName !== profileData?.name) {
      dataToUpdate.name = newFullName;
    }

    if (data.first_name !== profileData?.first_name) {
      dataToUpdate.first_name = data.first_name;
    }

    if (data.last_name !== profileData?.last_name) {
      dataToUpdate.last_name = data.last_name;
    }

    if (data.profile_image_url !== profileData?.profile_image_url) {
      dataToUpdate.profile_image_url = data.profile_image_url;
    }

    // Check phone details
    if (
      (data.phone_details?.number || '') !==
      (profileData?.phone_details?.number || '')
    ) {
      dataToUpdate.phone_details = {
        ...dataToUpdate.phone_details,
        number: data.phone_details?.number,
        country_code: data.phone_details?.country_code,
      };
    }

    if (
      (data.phone_details?.country_code || '') !==
      (profileData?.phone_details?.country_code || '')
    ) {
      dataToUpdate.phone_details = {
        ...dataToUpdate.phone_details,
        country_code: data.phone_details?.country_code,
        number: data.phone_details?.number,
      };
    }

    // Only make the API call if there are changes to update
    if (Object.keys(dataToUpdate).length > 0) {
      http
        .put('/v2/user/profile', dataToUpdate)
        .then(() => {
          setRegistrationButtonLoader(false);
          navigate({ to: '/user-registration/additional-info' });
        })
        .catch((error) => {
          console.error('Error updating profile:', error);
          setRegistrationButtonLoader(false);
        });
    } else {
      // If no changes, just navigate to the next step
      setRegistrationButtonLoader(false);
      navigate({ to: '/user-registration/additional-info' });
    }
  });

  // Check if phone details are valid
  const checkPhoneDetailsValidity = (phoneDetails: PhoneDetails): boolean => {
    if (!phoneDetails.number) {
      return false;
    } else if (phoneDetails.country_code) {
      return false;
    }
    return true;
  };

  // Go back to previous page
  const onBack = () => {
    window.history.back();
  };

  return (
    <div className="px-[72px] pt-[128px] pb-[72px] h-full flex flex-col justify-between overflow-auto">
      <div>
        <div className="w-[176px] h-[52px] mb-13">
          <img
            src="assets/flytbase-logo.svg"
            alt="FlytBase Logo"
            className="h-13"
          />
        </div>
        <div className="flex flex-col justify-between pt-13">
          <div className="pb-7 text-2xl font-semibold text-text-1">
            Tell us about yourself
          </div>

          {/* Registration Form */}
          <form className="flex flex-col" onSubmit={onContinue}>
            <div className="space-y-8">
              {/* First Name */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  First Name*
                </label>
                <Controller
                  name="first_name"
                  control={control}
                  rules={{
                    required: 'First name is required',
                    pattern: {
                      value: /\S+/,
                      message: 'First name cannot be empty',
                    },
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="First Name"
                      className="w-full p-2 bg-transparent border border-gray-600 rounded text-text-1 focus:outline-none focus:border-blue-500"
                    />
                  )}
                />
                {errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Last Name*
                </label>
                <Controller
                  name="last_name"
                  control={control}
                  rules={{
                    required: 'Last name is required',
                    pattern: {
                      value: /\S+/,
                      message: 'Last name cannot be empty',
                    },
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Last Name"
                      className="w-full p-2 bg-transparent border border-gray-600 rounded text-text-1 focus:outline-none focus:border-blue-500"
                    />
                  )}
                />
                {errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.last_name.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <Controller
                    name="phone_details.country_code"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="+1"
                        className="w-20 p-2 bg-transparent border border-gray-600 rounded text-text-1 focus:outline-none focus:border-blue-500"
                      />
                    )}
                  />
                  <Controller
                    name="phone_details.number"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="Phone Number"
                        className="flex-1 p-2 bg-transparent border border-gray-600 rounded text-text-1 focus:outline-none focus:border-blue-500"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Profile Picture */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Profile Picture
                </label>

                <div className="flex justify-center items-center h-[108px] w-[108px]">
                  {isProfileImageLoading ? (
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <img
                      className="ml-1 mt-2 h-[108px] w-[108px] object-cover rounded"
                      src={profileImageUrl || defaultImageUrl}
                      alt="Profile"
                    />
                  )}
                </div>

                <div className="pt-3 inline-block">
                  {profileImageUrl === defaultImageUrl ? (
                    <button
                      type="button"
                      className="bg-transparent border border-gray-600 text-text-1 px-4 py-2 rounded hover:bg-gray-800 transition duration-200"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Photo
                      <input
                        className="w-50"
                        hidden
                        type="file"
                        accept="image/jpeg, image/jpg, image/png"
                        ref={fileInputRef}
                        onChange={fileChanged}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="bg-transparent border border-gray-600 text-text-1 px-4 py-2 rounded hover:bg-gray-800 transition duration-200"
                      onClick={removeProfilePicture}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          className="bg-transparent border border-gray-600 text-text-1 px-4 py-2 rounded hover:bg-gray-800 transition duration-200"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded transition duration-200 ${
            isValid && !isPhoneInvalid
              ? 'bg-blue-400 hover:bg-blue-500 text-zinc-900'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
          disabled={!isValid || isPhoneInvalid || registrationButtonLoader}
          onClick={onContinue}
        >
          {registrationButtonLoader ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              <span>Continue</span>
            </div>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}

export default Register;
