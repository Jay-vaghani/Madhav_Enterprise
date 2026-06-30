import { API_BASE_URL } from "../../api/config";

export const checkOffenceHistory = async (mobile, token) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/confiscations/check?mobile=${mobile}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return await res.json();
  } catch (error) {
    console.error("Error checking offence history:", error);
    return { success: false, message: "Network error" };
  }
};

export const submitConfiscation = async (data, token) => {
  try {
    const res = await fetch(`${API_BASE_URL}/confiscations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.error("Error submitting confiscation:", error);
    return { success: false, message: "Network error" };
  }
};
