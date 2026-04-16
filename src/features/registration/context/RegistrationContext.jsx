import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const RegistrationContext = createContext(null);

export function RegistrationProvider({ children }) {
  // ── Shared form data across all 4 steps ─────────────────────
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    fullName: "",
    email: "",
    mobile: "",
    guardianMobile: "",
    pinCode: "",
    permanentAddress: "",

    // Step 2: Identity Verification
    enrollmentNumber: "",
    year: "",
    semester: "",
    department: null, // full DEPARTMENTS object
    shift: "",

    // Step 3: Financial Information
    pickupPoint: null, // full PICKUP_POINTS object

    // Step 4: Final Review
    photoBase64: null,
    termsAccepted: false,
  });

  // ── Active step (drives TabContext + MobileStepBar) ──────────
  const [activeStep, setActiveStep] = useState("1");

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const navigateToStep = useCallback((step) => {
    setActiveStep(String(step));
  }, []);

  return (
    <RegistrationContext.Provider
      value={{ formData, updateFormData, activeStep, setActiveStep, navigateToStep }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error("useRegistration must be used within <RegistrationProvider>");
  return ctx;
}
