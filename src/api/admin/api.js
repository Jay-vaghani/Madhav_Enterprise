import { API_BASE_URL } from "../config";

/**
 * Helper to build headers with JWT token
 */
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/**
 * POST /api/auth/login
 */
export const loginAdmin = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let errorMessage = "Login failed";
    try {
      const data = await response.json();
      if (data && data.message) errorMessage = data.message;
    } catch (e) {
      errorMessage = `Server Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * GET /api/admin/students/pending
 * Fetches ALL pending students — filtering is done on the frontend
 */
export const fetchPendingStudents = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/students/pending`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch students";
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

/**
 * POST /api/admin/students/:id/approve
 * Full approval with payment data, image handling, and receipt generation
 */
export const approveStudent = async (token, studentId, approvalData) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/students/${studentId}/approve`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(approvalData),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to approve student";
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

/**
 * PATCH /api/admin/students/:id/reject
 */
export const rejectStudent = async (token, studentId) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/students/${studentId}/reject`,
    { method: "PATCH", headers: authHeaders(token) }
  );

  if (!response.ok) {
    let errorMessage = "Failed to reject student";
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

/**
 * POST /api/admin/students/:id/update-photo
 */
export const updateStudentPhoto = async (token, studentId, photoBase64) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/students/${studentId}/update-photo`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ photoBase64 }),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to update photo";
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

/**
 * GET /api/admin/payment-stats
 */
export const fetchPaymentStats = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/payment-stats`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch payment stats";
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

/**
 * GET /api/admin/students/stats
 */
export const fetchDashboardStats = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/students/stats`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch stats";
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
