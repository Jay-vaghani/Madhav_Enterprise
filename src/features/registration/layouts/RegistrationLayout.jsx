import React from "react";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { TabContext, TabPanel } from "@mui/lab";
import { useNavigate } from "react-router-dom";
import { theme } from "../../../theme/theme";

// Layout components
import AppHeader from "../../../components/AppHeader";
import RegistrationSidebar from "../components/RegistrationSidebar";
import MobileStepBar from "../components/MobileStepBar";
import ProgressBar from "../components/ProgressBar";

// Step pages
import PersonalDetailsStep from "../pages/PersonalDetailsStep";
import IdentityVerificationStep from "../pages/IdentityVerificationStep";
import FinancialInformationStep from "../pages/FinancialInformationStep";
import FinalReviewStep from "../pages/FinalReviewStep";
import { useRegistration } from "../context/RegistrationContext";
import { isStepComplete, getMissingHint } from "../utils/validation";
import { registerStudent } from "../../../api/student/api";

const TOTAL_STEPS = 4;

export default function RegistrationLayout() {
  const { activeStep, setActiveStep, formData } = useRegistration();
  const navigate = useNavigate();

  const [errorState, setErrorState] = React.useState({ open: false, hint: "" });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const showError = (hint) => {
    setErrorState({ open: true, hint });
  };

  const handleCloseError = (event, reason) => {
    if (reason === "clickaway") return;
    setErrorState({ open: false, hint: errorState.hint });
  };

  const canGoToStep = (targetStepString) => {
    const target = parseInt(targetStepString);
    const current = parseInt(activeStep);

    // Allow going backwards freely
    if (target <= current) return true;

    // Going forward: validate *all* intermediate steps up to the target
    for (let i = current; i < target; i++) {
      if (!isStepComplete(i, formData)) {
        showError(getMissingHint(i, formData));
        return false;
      }
    }
    return true;
  };

  const handleStepChange = (_, newValue) => {
    if (canGoToStep(newValue)) {
      setActiveStep(newValue);
    }
  };

  const handleNext = () => {
    const nextStep = String(Math.min(TOTAL_STEPS, parseInt(activeStep) + 1));
    if (canGoToStep(nextStep)) {
      setActiveStep(nextStep);
    }
  };

  const handleSubmit = async () => {
    if (canGoToStep(String(TOTAL_STEPS + 1))) {
      setIsSubmitting(true);
      try {
        await registerStudent(formData);
        navigate("/success");
      } catch (error) {
        navigate("/error", { state: { message: error.message || "Registration failed" } });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Snackbar
        open={errorState.open}
        autoHideDuration={4000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          variant="filled"
          sx={{
            width: "100%",
            boxShadow: 3,
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          {errorState.hint}
        </Alert>
      </Snackbar>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          fontFamily: '"Inter", "Roboto", sans-serif',
          overflow: "hidden",
        }}
      >
        {/* ── HEADER ── */}
        <AppHeader />

        {/* ── MOBILE STEP BAR — only visible below lg ── */}
        <MobileStepBar activeStep={activeStep} onChange={handleStepChange} />

        {/* ── TAB CONTEXT wraps Sidebar (TabList) + Content (TabPanels) ── */}
        <TabContext value={activeStep}>
          <Grid
            container
            wrap="nowrap"
            sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}
          >
            {/* ── SIDEBAR (TabList) — hidden on mobile/tablet, visible on lg+ ── */}
            <Grid
              size="auto"
              sx={{
                height: "100%",
                display: { xs: "none", lg: "flex" },
                flexShrink: 0,
              }}
            >
              <RegistrationSidebar
                activeStep={activeStep}
                onChange={handleStepChange}
              />
            </Grid>

            {/* ── MAIN CONTENT — always visible, grows to fill remaining width ── */}
            <Grid size="grow" sx={{ minWidth: 0, height: "100%" }}>
              <Box
                component="main"
                sx={{
                  height: "100%",
                  overflowY: "auto",
                  p: { xs: 2, sm: 3, lg: 4 },
                  pb: { xs: "80px", lg: "100px" },
                  boxSizing: "border-box",
                }}
              >
                {/* Step 1 — Personal Details */}
                <TabPanel value="1" sx={{ p: 0 }}>
                  <PersonalDetailsStep />
                </TabPanel>

                {/* Step 2 — Identity Verification */}
                <TabPanel value="2" sx={{ p: 0 }}>
                  <IdentityVerificationStep />
                </TabPanel>

                {/* Step 3 — Financial Information */}
                <TabPanel value="3" sx={{ p: 0 }}>
                  <FinancialInformationStep />
                </TabPanel>

                {/* Step 4 — Final Review */}
                <TabPanel value="4" sx={{ p: 0 }}>
                  <FinalReviewStep />
                </TabPanel>
              </Box>
            </Grid>
          </Grid>
        </TabContext>

        {/* ── BOTTOM PROGRESS BAR ── */}
        <ProgressBar
          currentStep={parseInt(activeStep)}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </Box>
    </ThemeProvider>
  );
}
