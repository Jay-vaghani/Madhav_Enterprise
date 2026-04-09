import React from "react";
import { Box, Button, LinearProgress } from "@mui/material";
import { ArrowForward, CheckCircleOutlineOutlined } from "@mui/icons-material";
import { useRegistration } from "../context/RegistrationContext";

const TOTAL_STEPS = 4;

export default function ProgressBar({ currentStep = 1, onNext, onSubmit }) {
  const { formData } = useRegistration();

  const progress = Math.round((currentStep / TOTAL_STEPS) * 100);
  const isFinal = currentStep === TOTAL_STEPS;

  return (
    <>
      <Box
        component="footer"
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: { xs: 64, lg: 72 },
          px: { xs: 2, lg: 4 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "grey.100",
          boxShadow: "0 -4px 24px rgba(37,99,235,0.06)",
          zIndex: 100,
        }}
      >
        {/* Step progress */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Step {currentStep} of {TOTAL_STEPS}
          </p>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              width: 150,
              height: 8,
              borderRadius: 99,
              bgcolor: "#E2E8F0",
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #2563EB, #1D4ED8)",
                borderRadius: 99,
              },
            }}
          />
        </Box>

        {/* Next / Submit button */}
        <Button
          variant="contained"
          endIcon={
            isFinal ? <CheckCircleOutlineOutlined /> : <ArrowForward />
          }
          disableElevation
          onClick={isFinal ? onSubmit : onNext}
          sx={{
            height: 44,
            px: { xs: 2.5, lg: 3.5 },
            borderRadius: "10px",
            background: isFinal
              ? "linear-gradient(135deg, #059669, #047857)"
              : "linear-gradient(135deg, #2563EB, #1D4ED8)",
            fontWeight: 700,
            fontSize: { xs: "0.85rem", lg: "0.9rem" },
            letterSpacing: "0.02em",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: isFinal
                ? "0 6px 20px rgba(5,150,105,0.35)"
                : "0 6px 20px rgba(37,99,235,0.35)",
            },
            transition: "all 0.2s",
          }}
        >
          {isFinal ? "Submit" : "Next Step"}
        </Button>
      </Box>
    </>
  );
}
