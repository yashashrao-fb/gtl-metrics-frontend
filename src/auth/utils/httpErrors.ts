import { AxiosError } from 'axios';

/**
 * Standard error types for HTTP requests
 */
export enum HttpErrorType {
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  EMAIL_UNVERIFIED = 'email_unverified',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown',
}

/**
 * Standard error structure for HTTP errors
 */
export interface HttpErrorDetails {
  type: HttpErrorType;
  status?: number;
  message: string;
  originalError: any;
  code?: string;
}

/**
 * Maps an Axios error to our standardized error format
 */
export const mapAxiosError = (error: AxiosError | Error): HttpErrorDetails => {
  // Default error structure
  const defaultError: HttpErrorDetails = {
    type: HttpErrorType.UNKNOWN,
    message: 'An unknown error occurred',
    originalError: error,
  };

  // Check if this is an AxiosError
  if (!('isAxiosError' in error) || !(error as AxiosError).isAxiosError) {
    return {
      ...defaultError,
      type: HttpErrorType.NETWORK_ERROR,
      message: 'No response received from server',
    };
  }

  const axiosError = error as AxiosError;

  // Handle network errors (no response)
  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ERR_NETWORK') {
    return {
      ...defaultError,
      type: HttpErrorType.NETWORK_ERROR,
      message: 'Network error: Unable to connect to server',
    };
  }

  // If no response, return network error
  if (!axiosError.response) {
    return {
      ...defaultError,
      type: HttpErrorType.NETWORK_ERROR,
      message: 'No response received from server',
    };
  }

  // Map HTTP status codes to error types
  const status = axiosError.response.status;
  let errorDetails: HttpErrorDetails = {
    ...defaultError,
    status,
  };

  switch (status) {
    case 401:
      errorDetails = {
        ...errorDetails,
        type: HttpErrorType.UNAUTHORIZED,
        message: 'Authentication required. Please login.',
      };
      break;
    case 403:
      errorDetails = {
        ...errorDetails,
        type: HttpErrorType.FORBIDDEN,
        message: 'You do not have permission to access this resource',
      };
      break;
    case 404:
      errorDetails = {
        ...errorDetails,
        type: HttpErrorType.NOT_FOUND,
        message: 'Resource not found',
      };
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      errorDetails = {
        ...errorDetails,
        type: HttpErrorType.SERVER_ERROR,
        message: 'Server error. Please try again later.',
      };
      break;
    default:
      errorDetails = {
        ...errorDetails,
        message: axiosError.message || 'An error occurred',
      };
  }

  // Try to extract more detailed error info from response data
  try {
    const responseData = axiosError.response.data as Record<string, any>;
    if (responseData) {
      if (typeof responseData.message === 'string') {
        errorDetails.message = responseData.message;
      }
      if (typeof responseData.code === 'string') {
        errorDetails.code = responseData.code;
      }
    }
  } catch (e) {
    // If we can't parse error data, use what we have
  }

  return errorDetails;
};

/**
 * Create a specific email unverified error
 */
export const createEmailUnverifiedError = (
  originalError: any
): HttpErrorDetails => {
  return {
    type: HttpErrorType.EMAIL_UNVERIFIED,
    status: 403,
    message: 'Email is not verified',
    code: 'EMAIL_UNVERIFIED',
    originalError,
  };
};
