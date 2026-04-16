import React from "react";
import { Routes, Route } from "react-router-dom";

import RegistrationLayout from "./features/registration/layouts/RegistrationLayout";
import SuccessPage from "./features/registration/pages/SuccessPage";
import RegistrationErrorPage from "./features/registration/pages/RegistrationErrorPage";

// Admin feature
import AdminLoginPage from "./features/admin/pages/AdminLoginPage";
import DashboardLayout from "./features/admin/layouts/DashboardLayout";
import ProtectedRoute from "./features/admin/components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Student Registration Routes */}
      <Route path="/" element={<RegistrationLayout />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/error" element={<RegistrationErrorPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin/dashboard" element={<DashboardLayout />} />
      </Route>
    </Routes>
  );
}
