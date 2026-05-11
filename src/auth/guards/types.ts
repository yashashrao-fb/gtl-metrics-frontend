import { AuthContextType } from '../types';
import { AxiosInstance } from 'axios';

/**
 * Auth guard context type
 * Combines auth context with optional HTTP client (Axios instance)
 */
export type GuardContext = AuthContextType & {
  httpClient?: AxiosInstance;
};

/**
 * Guard function type
 * Represents a route guard function that receives a guard context
 */
export type GuardFunction = (
  context: GuardContext,
  ...args: any[]
) => Promise<void>;

/**
 * Route loader context from TanStack Router
 */
export type RouteLoaderContext = {
  context: {
    auth?: AuthContextType;
    httpClient?: AxiosInstance;
    [key: string]: any;
  };
  [key: string]: any;
};
