import { API_BASE_URL } from '../config';

export const checkerLogin = async (pin) => {
  const response = await fetch(`${API_BASE_URL}/students/checker/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pin }),
  });

  if (!response.ok) {
    let errorMessage = "Invalid PIN";
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

export const getStudentByReceipt = async (receiptNumber, token) => {
  const response = await fetch(`${API_BASE_URL}/students/checker/${encodeURIComponent(receiptNumber)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch student details";
    try {
      const data = await response.json();
      if (data && data.message) {
        errorMessage = data.message;
      }
    } catch (e) {
      errorMessage = `Server Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const searchStudentByName = async (name, token) => {
  const response = await fetch(`${API_BASE_URL}/students/checker/search/${encodeURIComponent(name)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch student details";
    try {
      const data = await response.json();
      if (data && data.message) {
        errorMessage = data.message;
      }
    } catch (e) {
      errorMessage = `Server Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const searchStudentByPickupPoint = async (pickupPointLabel, token) => {
  const response = await fetch(`${API_BASE_URL}/students/checker/pickup-point/${encodeURIComponent(pickupPointLabel)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch student details";
    try {
      const data = await response.json();
      if (data && data.message) {
        errorMessage = data.message;
      }
    } catch (e) {
      errorMessage = `Server Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const searchStudentByDepartment = async (department, token) => {
  const response = await fetch(`${API_BASE_URL}/students/checker/department/${encodeURIComponent(department)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch student details";
    try {
      const data = await response.json();
      if (data && data.message) {
        errorMessage = data.message;
      }
    } catch (e) {
      errorMessage = `Server Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
