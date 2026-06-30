import { API_BASE_URL } from "../../api/config";

export const getConfiscations = async (token) => {
  try {
    const res = await fetch(`${API_BASE_URL}/confiscations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching confiscations:", error);
    return { success: false, message: "Network error" };
  }
};

export const releaseIdCard = async (id, token) => {
  try {
    const res = await fetch(`${API_BASE_URL}/confiscations/${id}/release`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error releasing ID card:", error);
    return { success: false, message: "Network error" };
  }
};

export const getStudentHistory = async (mobile, token) => {
  try {
    const res = await fetch(`${API_BASE_URL}/confiscations/student/${mobile}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching student history:", error);
    return { success: false, message: "Network error" };
  }
};
