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
 * DELETE /api/admin/students/:id
 */
export const deleteStudent = async (token, studentId) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/students/${studentId}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to delete student";
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
 * POST /api/admin/staff/:id/update-photo
 */
export const updateStaffPhoto = async (token, staffId, photoBase64) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/staff/${staffId}/update-photo`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ photoBase64 }),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to update staff photo";
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
 * PATCH /api/admin/staff-payments/:id/amount
 * Update the amount of a pending staff payment entry
 */
export const updateStaffPaymentAmount = async (token, paymentId, amount) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/staff-payments/${paymentId}/amount`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ amount }),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to update payment amount";
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
 * PATCH /api/admin/staff-payments/:id/details
 * Update UTR, account, notes, or amount on any staff payment (including approved)
 */
export const updateStaffPaymentDetails = async (token, paymentId, updates) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/staff-payments/${paymentId}/details`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to update payment details";
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
 * DELETE /api/admin/staff-payments/:id
 * Delete a staff payment entry entirely
 */
export const deleteStaffPayment = async (token, paymentId) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/staff-payments/${paymentId}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to delete payment";
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
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);

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
  if (filters.department) params.set("department", filters.department);
  if (filters.route) params.set("route", filters.route);
  if (filters.approvedDateFrom) params.set("approvedDateFrom", filters.approvedDateFrom);
  if (filters.approvedDateTo) params.set("approvedDateTo", filters.approvedDateTo);
  if (filters.searchName) params.set("searchName", filters.searchName);
  if (filters.searchReceipt) params.set("searchReceipt", filters.searchReceipt);
  if (filters.searchMobile) params.set("searchMobile", filters.searchMobile);
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
// ═══════════════════════════════════════════════════════════════
// Staff Analytics API
// ═══════════════════════════════════════════════════════════════

export const fetchStaffAnalytics = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/staff-analytics`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch staff analytics";
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
// Staff Settings API - Staff Pickup Points
// ═══════════════════════════════════════════════════════════════

export const fetchAllStaffPickupPoints = async (token) => {
  const response = await fetch(`${API_BASE_URL}/staff-settings/pickup-points`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch staff pickup points";
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

export const createStaffPickupPoint = async (token, pickupPointData) => {
  const response = await fetch(`${API_BASE_URL}/staff-settings/pickup-points`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(pickupPointData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to create staff pickup point";
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

export const updateStaffPickupPoint = async (token, id, pickupPointData) => {
  const response = await fetch(`${API_BASE_URL}/staff-settings/pickup-points/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(pickupPointData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to update staff pickup point";
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

export const deleteStaffPickupPoint = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/staff-settings/pickup-points/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = "Failed to delete staff pickup point";
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
// Bus Management API
// ═══════════════════════════════════════════════════════════════

export const fetchAllBuses = async (token) => {
  const response = await fetch(`${API_BASE_URL}/buses`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch buses");
  return response.json();
};

export const createBus = async (token, busData) => {
  const response = await fetch(`${API_BASE_URL}/buses`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(busData),
  });
  if (!response.ok) throw new Error("Failed to create bus");
  return response.json();
};

export const updateBus = async (token, id, busData) => {
  const response = await fetch(`${API_BASE_URL}/buses/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(busData),
  });
  if (!response.ok) throw new Error("Failed to update bus");
  return response.json();
};

export const deleteBus = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/buses/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete bus");
  return response.json();
};

// ═══════════════════════════════════════════════════════════════
// Fuel Management API
// ═══════════════════════════════════════════════════════════════

export const fetchAllFuelEntries = async (token, busId = "", startDate = "", endDate = "", driverId = "") => {
  const params = new URLSearchParams();
  if (busId) params.set("busId", busId);
  if (driverId) params.set("driverId", driverId);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const qs = params.toString();
  const url = `${API_BASE_URL}/fuel${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch fuel entries");
  return response.json();
};

export const fetchFuelAnalytics = async (token, startDate = "", endDate = "") => {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const qs = params.toString();
  const url = `${API_BASE_URL}/fuel/analytics${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch fuel analytics");
  return response.json();
};

export const createFuelEntry = async (token, fuelData) => {
  const response = await fetch(`${API_BASE_URL}/fuel`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(fuelData),
  });
  if (!response.ok) throw new Error("Failed to create fuel entry");
  return response.json();
};

export const updateFuelEntry = async (token, id, fuelData) => {
  const response = await fetch(`${API_BASE_URL}/fuel/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(fuelData),
  });
  if (!response.ok) throw new Error("Failed to update fuel entry");
  return response.json();
};

export const deleteFuelEntry = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/fuel/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete fuel entry");
  return response.json();
};

// ═══════════════════════════════════════════════════════════════
// Driver Management API
// ═══════════════════════════════════════════════════════════════

export const fetchAllDrivers = async (token) => {
  const response = await fetch(`${API_BASE_URL}/drivers`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch drivers");
  }
  return response.json();
};

export const createDriver = async (token, driverData) => {
  const response = await fetch(`${API_BASE_URL}/drivers`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(driverData),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to create driver");
  }
  return response.json();
};

export const updateDriver = async (token, id, driverData) => {
  const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(driverData),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update driver");
  }
  return response.json();
};

export const deleteDriver = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete driver");
  }
  return response.json();
};

// ═══════════════════════════════════════════════════════════════
// Staff Management API (Public & Admin)
// ═══════════════════════════════════════════════════════════════

// --- Public Staff API ---
export const registerStaff = async (staffData) => {
  const response = await fetch(`${API_BASE_URL}/staff/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffData),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to register staff");
  }
  return response.json();
};

export const fetchStaffPickupPoints = async () => {
  const response = await fetch(`${API_BASE_URL}/staff-settings/public/pickup-points`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch pickup points");
  }
  return response.json();
};

export const lookupStaff = async (mobile) => {
  const response = await fetch(`${API_BASE_URL}/staff/lookup/${mobile}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Staff not found");
  }
  return response.json();
};

export const fetchStaffPendingMonths = async (mobile) => {
  const response = await fetch(`${API_BASE_URL}/staff/pending-months/${mobile}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch pending months");
  }
  return response.json();
};

export const submitStaffPayment = async (paymentData) => {
  const response = await fetch(`${API_BASE_URL}/staff/submit-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to submit payment");
  }
  return response.json();
};

// --- Admin Staff API ---
export const fetchAllStaff = async (token, params = {}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", params.page);
  if (params.limit) qs.set("limit", params.limit);

  const url = `${API_BASE_URL}/admin/staff${qs.toString() ? `?${qs.toString()}` : ""}`;
  const response = await fetch(url, { headers: authHeaders(token) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch staff");
  }
  return response.json();
};

export const fetchStaffById = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/admin/staff/${id}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch staff details");
  }
  return response.json();
};

export const activateStaffService = async (token, id, startDate) => {
  const response = await fetch(`${API_BASE_URL}/admin/staff/${id}/activate`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ startDate }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to activate service");
  }
  return response.json();
};

export const deactivateStaffService = async (token, id, endDate) => {
  const response = await fetch(`${API_BASE_URL}/admin/staff/${id}/deactivate`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ endDate }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to deactivate service");
  }
  return response.json();
};

export const updateStaff = async (token, id, staffData) => {
  const response = await fetch(`${API_BASE_URL}/admin/staff/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(staffData),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to update staff");
  }
  return response.json();
};

export const deleteStaff = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/admin/staff/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete staff");
  }
  return response.json();
};

export const fetchPendingStaffPayments = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/staff-payments/pending`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch pending payments");
  }
  return response.json();
};

export const approveStaffPayment = async (token, id, paymentData) => {
  const response = await fetch(`${API_BASE_URL}/admin/staff-payments/${id}/approve`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to approve payment");
  }
  return response.json();
};

export const createManualStaffPayment = async (token, paymentData) => {
  const response = await fetch(`${API_BASE_URL}/admin/staff-payments/manual`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to create manual payment");
  }
  return response.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// Bus Documents
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/bus-documents/:busId
 */
export const fetchBusDocuments = async (token, busId) => {
  const response = await fetch(`${API_BASE_URL}/bus-documents/${busId}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch bus documents");
  }
  return response.json();
};

/**
 * POST /api/bus-documents
 * body: { busId, title, expiryDate, photoBase64 }
 */
export const addBusDocument = async (token, data) => {
  const response = await fetch(`${API_BASE_URL}/bus-documents`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to add document");
  }
  return response.json();
};

/**
 * DELETE /api/bus-documents/:id
 */
export const deleteBusDocument = async (token, docId) => {
  const response = await fetch(`${API_BASE_URL}/bus-documents/${docId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete document");
  }
  return response.json();
};

/**
 * PUT /api/bus-documents/:id
 * body: { title, expiryDate, hasHardCopy }
 */
export const updateBusDocument = async (token, docId, data) => {
  const response = await fetch(`${API_BASE_URL}/bus-documents/${docId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to update document");
  }
  return response.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// Bus Maintenance
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/bus-maintenance/:busId
 */
export const fetchBusMaintenance = async (token, busId) => {
  const response = await fetch(`${API_BASE_URL}/bus-maintenance/${busId}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch maintenance records");
  }
  return response.json();
};

/**
 * POST /api/bus-maintenance
 * body: { busId, maintenanceType, datePerformed, odometerAtMaintenance, intervalKm,
 *         nextDueOdometer, cost, notes, billPhotoBase64 }
 */
export const addBusMaintenance = async (token, data) => {
  const response = await fetch(`${API_BASE_URL}/bus-maintenance`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to add maintenance record");
  }
  return response.json();
};

/**
 * DELETE /api/bus-maintenance/:id
 */
export const deleteBusMaintenance = async (token, recordId) => {
  const response = await fetch(`${API_BASE_URL}/bus-maintenance/${recordId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete maintenance record");
  }
  return response.json();
};

/**
 * PUT /api/bus-maintenance/:id
 * body: { maintenanceType, datePerformed, odometerAtMaintenance, intervalKm,
 *         nextDueOdometer, cost, notes, hasHardCopy }
 */
export const updateBusMaintenance = async (token, recordId, data) => {
  const response = await fetch(`${API_BASE_URL}/bus-maintenance/${recordId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Failed to update maintenance record");
  }
  return response.json();
};

/**
 * GET /api/bus-maintenance/alerts?busId= (optional)
 * Returns per-bus maintenance alert status comparing latest odometer
 * against nextDueOdometer for all maintenance records.
 */
export const fetchMaintenanceAlerts = async (token, busId = "") => {
  const params = new URLSearchParams();
  if (busId) params.set("busId", busId);
  const qs = params.toString();
  const url = `${API_BASE_URL}/bus-maintenance/alerts${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch maintenance alerts");
  }
  return response.json();
};

/**
 * GET /api/admin/staff-payments/pending-summary
 * Returns all staff with pending payment counts and total pending amounts,
 * sorted by totalPending DESC. Used for sort-by-pending and Excel export.
 */
export const fetchStaffPendingSummary = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/staff-payments/pending-summary`,
    { headers: authHeaders(token) }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch staff pending summary");
  }
  return response.json();
};
