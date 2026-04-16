export const API_BASE_URL = 'http://0.0.0.0:3000/api';

export const handleApiError = (error) => {
  console.error("API call error:", error);
  throw error;
};
