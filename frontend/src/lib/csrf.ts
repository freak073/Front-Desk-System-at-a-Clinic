import { api } from './api';

let csrfToken: string | null = null;

export const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    // Make a GET request to get the CSRF token
    const response = await api.get('/security/csrf-token');
    const token = response.data.data.csrfToken;
    if (!token) {
      throw new Error('No CSRF token received from server');
    }
    csrfToken = token;
    return token;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    throw new Error('Failed to get CSRF token');
  }
};

export const clearCsrfToken = () => {
  csrfToken = null;
};