import { API_BASE_URL } from '../config';

export const registerStudent = async (studentData) => {
  const response = await fetch(`${API_BASE_URL}/students/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(studentData),
  });

  // Check if response is not ok before trying to parse JSON
  // Sometimes express returning 500 sends HTML instead of JSON which causes response.json() to fail
  if (!response.ok) {
    let errorMessage = "Failed to register student";
    try {
      const data = await response.json();
      if (data && data.message) {
        errorMessage = data.message;
      }
    } catch (e) {
      // response wasn't JSON
      errorMessage = `Server Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
