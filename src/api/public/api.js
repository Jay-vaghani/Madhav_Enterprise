/**
 * Public API - No authentication required
 * Used by registration form to fetch dynamic settings
 */

import { API_BASE_URL } from "../config";

/**
 * GET /api/settings/public
 * Get public settings (shifts, departments, pickup points) for registration form
 */
export const getPublicSettings = async () => {
  const response = await fetch(`${API_BASE_URL}/settings/public`);

  if (!response.ok) {
    let errorMessage = "Failed to fetch settings";
    try {
      const data = await response.json();
      if (data && data.message) errorMessage = data.message;
    } catch (e) {
      errorMessage = `Server Error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};