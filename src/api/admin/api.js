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
export const rejectStudent = async (token, studentId, reason = '') => {
  const response = await fetch(
    `${API_BASE_URL}/admin/students/${studentId}/reject`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ reason }),
    }
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
 * GET /api/admin/students/rejected
 */
export const fetchRejectedStudents = async (token, page = 1, limit = 50) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/students/rejected?page=${page}&limit=${limit}`,
    { headers: authHeaders(token) }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch rejected students");
  }
  return response.json();
};

/**
 * POST /api/admin/rejected-students/:id/restore
 */
export const restoreRejectedStudent = async (token, id) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/rejected-students/${id}/restore`,
    { method: "POST", headers: authHeaders(token) }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to restore student");
  }
  return response.json();
};

/**
 * DELETE /api/admin/rejected-students/:id
 */
export const permanentDeleteRejected = async (token, id) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/rejected-students/${id}`,
    { method: "DELETE", headers: authHeaders(token) }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete record");
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

/**
 * GET /api/admin/analytics
 * Combined stats + trend data for the Reports & Analytics page
 *
 * @param {string} token
 * @param {Object} filters - { period, year, shift, department, route }
 */
export const fetchAnalytics = async (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.period) params.set("period", filters.period);
  if (filters.year) params.set("year", filters.year);
  if (filters.shift) params.set("shift", filters.shift);
  if (filters.department) params.set("department", filters.department);
  if (filters.route) params.set("route", filters.route);

  const qs = params.toString();
  const url = `${API_BASE_URL}/admin/analytics${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch analytics";
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
 * GET /api/admin/students/approved
 * @param {string} token
 * @param {Object} filters - { year, shift, department, route, page, limit }
 */
export const fetchApprovedStudents = async (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.year) params.set("year", filters.year);
  if (filters.shift) params.set("shift", filters.shift);
  if (filters.department) params.set("department", filters.department);
  if (filters.route) params.set("route", filters.route);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const qs = params.toString();
  const url = `${API_BASE_URL}/admin/students/approved${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, { headers: authHeaders(token) });

  if (!response.ok) {
    let errorMessage = "Failed to fetch approved students";
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
 * GET /api/admin/approved-students/:receiptNumber/receipt
 */
export const fetchReceiptForReprint = async (token, receiptNumber) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/approved-students/${encodeURIComponent(receiptNumber)}/receipt`,
    { headers: authHeaders(token) }
  );

  if (!response.ok) {
    let errorMessage = "Failed to fetch receipt";
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
 * PATCH /api/admin/approved-students/:id
 * Updates an approved student's details + payment record
 */
export const updateApprovedStudent = async (token, id, payload) => {
  const response = await fetch(`${API_BASE_URL}/admin/approved-students/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "Failed to update student";
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

// ═══════════════════════════════════════════════════════════════
// Cancellation & Refund API
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/cancellation/search?q=<query>
 */
export const searchCancellation = async (token, query) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/cancellation/search?q=${encodeURIComponent(query)}`,
    { headers: authHeaders(token) }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Search failed");
  }
  return response.json();
};

/**
 * GET /api/admin/cancellation/stats
 */
export const fetchCancellationStats = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/cancellation/stats`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch stats");
  }
  return response.json();
};

/**
 * POST /api/admin/cancellation/process
 */
export const processCancellation = async (token, payload) => {
  const response = await fetch(`${API_BASE_URL}/admin/cancellation/process`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to process cancellation");
  }
  return response.json();
};

/**
 * GET /api/admin/cancellation/history
 */
export const fetchCancellationHistory = async (token, page = 1, limit = 50) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/cancellation/history?page=${page}&limit=${limit}`,
    { headers: authHeaders(token) }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch history");
  }
  return response.json();
};

/**
 * POST /api/admin/cancellation/:id/undo
 */
export const undoCancellation = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/admin/cancellation/${id}/undo`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to undo cancellation");
  }
  return response.json();
};

/**
 * PATCH /api/admin/cancellation/:id
 */
export const editCancellation = async (token, id, payload) => {
  const response = await fetch(`${API_BASE_URL}/admin/cancellation/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to edit cancellation");
  }
  return response.json();
};

// ═══════════════════════════════════════════════════════════════
// Temporary Passes API
// ═══════════════════════════════════════════════════════════════

export const generateTemporaryPass = async (token, payload) => {
  const response = await fetch(`${API_BASE_URL}/admin/temporary-passes`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to generate pass");
  }
  return response.json();
};

export const fetchTemporaryPasses = async (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.department) params.set("department", filters.department);
  if (filters.pickupPoint) params.set("pickupPoint", filters.pickupPoint);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const qs = params.toString();
  const url = `${API_BASE_URL}/admin/temporary-passes${qs ? "?" + qs : ""}`;

  const response = await fetch(url, { headers: authHeaders(token) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch passes");
  }
  return response.json();
};

export const updateTemporaryPass = async (token, id, payload) => {
  const response = await fetch(`${API_BASE_URL}/admin/temporary-passes/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update pass");
  }
  return response.json();
};

export const deleteTemporaryPass = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/admin/temporary-passes/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete pass");
  }
  return response.json();
};

// ═══════════════════════════════════════════════════════════════
// Settings Management API - Shifts, Departments, Pickup Points
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/settings/public
 * Get public settings for registration form (no auth required)
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

// Shifts
export const fetchAllShifts = async (token) => {
  const response = await fetch(`${API_BASE_URL}/settings/shifts`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch shifts";
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

export const createShift = async (token, shiftData) => {
  const response = await fetch(`${API_BASE_URL}/settings/shifts`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(shiftData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to create shift";
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

export const updateShift = async (token, id, shiftData) => {
  const response = await fetch(`${API_BASE_URL}/settings/shifts/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(shiftData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to update shift";
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

export const deleteShift = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/settings/shifts/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to delete shift";
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

// Departments
export const fetchAllDepartments = async (token) => {
  const response = await fetch(`${API_BASE_URL}/settings/departments`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch departments";
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

export const createDepartment = async (token, departmentData) => {
  const response = await fetch(`${API_BASE_URL}/settings/departments`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(departmentData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to create department";
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

export const updateDepartment = async (token, id, departmentData) => {
  const response = await fetch(`${API_BASE_URL}/settings/departments/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(departmentData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to update department";
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

export const deleteDepartment = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/settings/departments/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to delete department";
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

// Pickup Points
export const fetchAllPickupPoints = async (token) => {
  const response = await fetch(`${API_BASE_URL}/settings/pickup-points`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch pickup points";
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

export const createPickupPoint = async (token, pickupPointData) => {
  const response = await fetch(`${API_BASE_URL}/settings/pickup-points`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(pickupPointData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to create pickup point";
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

export const updatePickupPoint = async (token, id, pickupPointData) => {
  const response = await fetch(`${API_BASE_URL}/settings/pickup-points/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(pickupPointData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to update pickup point";
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

export const deletePickupPoint = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/settings/pickup-points/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to delete pickup point";
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

// ═══════════════════════════════════════════════════════════════
// Staff Management API
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/staff
 * Create a new staff user (admin only)
 */
export const createStaff = async (token, staffData) => {
  const response = await fetch(`${API_BASE_URL}/auth/staff`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(staffData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to create staff user";
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
 * GET /api/auth/staff
 * Get all staff users (admin only)
 */
export const fetchAllStaff = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/staff`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch staff users";
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
 * DELETE /api/auth/staff/:id
 * Delete a staff user (admin only)
 */
export const deleteStaff = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/auth/staff/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to delete staff user";
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
