import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getPublicSettings } from "../../../api/public/api";

const RegistrationContext = createContext(null);

// Static YEARS data (remains unchanged)
export const YEARS = [
  {
    value: "1",
    label: "First Year",
    autoSemester: "Semester 1-2",
    semesters: [{ value: "Semester 1-2", label: "Semester 1 - 2" }],
  },
  {
    value: "2",
    label: "Second Year",
    autoSemester: "Semester 3-4",
    semesters: [{ value: "Semester 3-4", label: "Semester 3 - 4" }],
  },
  {
    value: "3",
    label: "Third Year",
    autoSemester: "Semester 5-6",
    semesters: [{ value: "Semester 5-6", label: "Semester 5 - 6" }],
  },
  {
    value: "4",
    label: "Fourth Year",
    autoSemester: "Semester 7-8",
    semesters: [{ value: "Semester 7-8", label: "Semester 7 - 8" }],
  },
];

export function RegistrationProvider({ children }) {
  // ── Dynamic settings from API ────────────────────────────────
  const [settings, setSettings] = useState({
    shifts: [],
    departments: [],
    pickupPoints: [],
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

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
    department: null, // full department object
    shift: "",
    completedKpguDiploma: false,

    // Step 3: Financial Information
    pickupPoint: null, // full pickup point object

    // Step 4: Final Review
    photoBase64: null,
    termsAccepted: false,
  });

  // ── Active step (drives TabContext + MobileStepBar) ──────────
  const [activeStep, setActiveStep] = useState("1");

  // ── Fetch settings on mount (with auto-retry) ──────────────
  const loadSettings = useCallback(async (attempt = 0) => {
    try {
      setSettingsLoading(true);
      setSettingsError(null);
      const response = await getPublicSettings();
      if (response.success) {
        // Sometimes the API returns success but with empty arrays due to cold start
        const deps = response.departments || [];
        const pps = response.pickupPoints || [];
        const shs = response.shifts || [];

        // If we got empty data and haven't exceeded retries, try again
        if (deps.length === 0 && pps.length === 0 && attempt < 3) {
          setTimeout(() => loadSettings(attempt + 1), 2000);
          return;
        }

        setSettings({
          shifts: shs,
          departments: deps,
          pickupPoints: pps,
        });
        setSettingsError(null);
      } else {
        throw new Error(response.message || "Failed to load settings");
      }
    } catch (error) {
      console.error(`Settings load attempt ${attempt + 1} failed:`, error);
      if (attempt < 3) {
        // Auto-retry with back-off
        setTimeout(() => loadSettings(attempt + 1), 2000 * (attempt + 1));
      } else {
        setSettingsError(error.message);
      }
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const navigateToStep = useCallback((step) => {
    setActiveStep(String(step));
  }, []);

  return (
    <RegistrationContext.Provider
      value={{ 
        formData, 
        updateFormData, 
        activeStep, 
        setActiveStep, 
        navigateToStep,
        // Dynamic settings
        shifts: settings.shifts,
        departments: settings.departments,
        pickupPoints: settings.pickupPoints,
        years: YEARS,
        settingsLoading,
        settingsError,
        retryLoadSettings: () => loadSettings(0),
      }}
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
