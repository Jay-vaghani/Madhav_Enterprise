import React from "react";
import { Box } from "@mui/material";
import {
  AccountBalance,
  Assignment,
  Business,
  CheckCircle,
  Fingerprint,
} from "@mui/icons-material";

const STEPS = [
  { label: "Personal Details", Icon: Business, value: "1" },
  { label: "Identity", Icon: Fingerprint, value: "2" },
  { label: "Financial", Icon: AccountBalance, value: "3" },
  { label: "Final Review", Icon: Assignment, value: "4" },
];

/**
 * Horizontal step bar shown only on mobile/tablet (below lg breakpoint).
 * @param {{ activeStep: string; onChange: (e: any, value: string) => void }} props
 */
export default function MobileStepBar({ activeStep, onChange }) {
  const active = parseInt(activeStep);

  return (
    <Box
      sx={{
        display: { xs: "flex", lg: "none" },
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "grey.100",
        boxShadow: "0 1px 8px rgba(37,99,235,0.05)",
        position: "relative",
      }}
    >
      {/* Connector line behind the steps */}
      <Box
        sx={{
          position: "absolute",
          top: "38%",
          left: "10%",
          right: "10%",
          height: 2,
          bgcolor: "grey.200",
          zIndex: 0,
        }}
      />
      {/* Progress fill */}
      <Box
        sx={{
          position: "absolute",
          top: "38%",
          left: "10%",
          width: `${((active - 1) / (STEPS.length - 1)) * 80}%`,
          height: 2,
          background: "linear-gradient(90deg, #2563EB, #1D4ED8)",
          zIndex: 1,
          transition: "width 0.4s ease",
        }}
      />

      {STEPS.map(({ label, Icon, value }, idx) => {
        const stepNum = idx + 1;
        const isActive = active === stepNum;
        const isDone = active > stepNum;

        return (
          <Box
            key={value}
            onClick={() => onChange(null, value)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              zIndex: 2,
              cursor: "pointer",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
              // Enlarge the tap target without affecting visual size
              p: 0.5,
              m: -0.5,
            }}
          >
            {/* Step circle */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: isActive
                  ? "linear-gradient(135deg, #2563EB, #1D4ED8)"
                  : isDone
                  ? "#10B981"
                  : "#E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isActive
                  ? "0 4px 12px rgba(37,99,235,0.35)"
                  : "none",
                transition: "all 0.3s",
              }}
            >
              {isDone ? (
                <CheckCircle sx={{ fontSize: 16, color: "#fff" }} />
              ) : (
                <Icon
                  sx={{
                    fontSize: 15,
                    color: isActive ? "#fff" : "#94A3B8",
                  }}
                />
              )}
            </Box>

            {/* Step label */}
            <p
              style={{
                margin: 0,
                fontSize: "0.55rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#2563EB" : isDone ? "#10B981" : "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </p>
          </Box>
        );
      })}
    </Box>
  );
}
