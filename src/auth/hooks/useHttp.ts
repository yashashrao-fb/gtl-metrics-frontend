import { useContext } from 'react';
import { AxiosInstance } from 'axios';
import { HttpContext } from '../providers/HttpProvider';

export const useHttp = (): AxiosInstance => {
  const context = useContext(HttpContext);
  if (!context) {
    throw new Error('useHttp must be used within an HttpProvider');
  }
  return context.client;
};
