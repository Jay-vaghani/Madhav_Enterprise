export const API_BASE_URL =
  "https://dqe8dosrs7.execute-api.ap-south-1.amazonaws.com/api";

export const handleApiError = (error) => {
  console.error("API call error:", error);
  throw error;
};
