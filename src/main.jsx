import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { RegistrationProvider } from "./features/registration/context/RegistrationContext.jsx";
import { AuthProvider } from "./features/admin/context/AuthContext.jsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RegistrationProvider>
          <App />
        </RegistrationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
