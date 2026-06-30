import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import RegistrationLayout from "./features/registration/layouts/RegistrationLayout";
import SuccessPage from "./features/registration/pages/SuccessPage";
import RegistrationErrorPage from "./features/registration/pages/RegistrationErrorPage";

// Admin feature
import AdminLoginPage from "./features/admin/pages/AdminLoginPage";
import DashboardLayout from "./features/admin/layouts/DashboardLayout";
import ProtectedRoute from "./features/admin/components/ProtectedRoute";

import StaffRegistrationPage from "./features/staff/pages/StaffRegistrationPage";
import StaffPaymentPage from "./features/staff/pages/StaffPaymentPage";

// Checker feature
import CheckerLoginPage from "./features/checker/pages/CheckerLoginPage";
import BusCheckerPage from "./features/checker/pages/BusCheckerPage";

export default function App() {
  return (
    <Routes>
      {/* Student Registration Routes */}
      <Route path="/" element={<RegistrationLayout />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/error" element={<RegistrationErrorPage />} />

      {/* Staff Public Routes */}
      <Route path="/staff" element={<StaffRegistrationPage />} />
      <Route path="/staff/payment" element={<StaffPaymentPage />} />

      {/* Checker Routes */}
      <Route path="/checker/login" element={<CheckerLoginPage />} />
      <Route path="/checker/verify" element={<BusCheckerPage />} />
      <Route
        path="/checker"
        element={<Navigate to="/checker/login" replace />}
      />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin/dashboard" element={<DashboardLayout />} />
      </Route>
    </Routes>
  );
}
