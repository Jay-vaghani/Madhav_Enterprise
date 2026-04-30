import React from "react";
import { Box, Tab } from "@mui/material";
import { TabList } from "@mui/lab";
import { Assignment, Person, School, LocationOn } from "@mui/icons-material";

const STEPS = [
  { label: "Students Details", Icon: Person, value: "1" },
  { label: "Academics Details", Icon: School, value: "2" },
  { label: "Pickup Point", Icon: LocationOn, value: "3" },
  { label: "Declaration", Icon: Assignment, value: "4" },
];

/**
 * @param {{ activeStep: string; onChange: (e, value: string) => void }} props
 */
export default function RegistrationSidebar({ activeStep, onChange }) {
  return (
    <Box
      component="aside"
      sx={{
        width: 220,
        minWidth: 220,
        height: "100%",
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "grey.100",
        display: "flex",
        flexDirection: "column",
        pt: 3,
        pb: 2,
        boxSizing: "border-box",
      }}
    >
      {/* Section label */}
      <Box sx={{ px: 3, mb: 2 }}>
        <p
          style={{
            margin: "0 0 2px 0",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#2563EB",
            textTransform: "uppercase",
          }}
        >
          Registration
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            color: "#64748B",
            fontWeight: 500,
          }}
        >
          Step {activeStep} of {STEPS.length}
        </p>
      </Box>

      {/* TabList as vertical nav */}
      <TabList
        orientation="vertical"
        onChange={onChange}
        aria-label="Registration steps"
        tabindicatorprops={{
          style: {
            left: 0,
            width: 3,
            borderRadius: "0 3px 3px 0",
            background: "linear-gradient(180deg, #2563EB, #1D4ED8)",
          },
        }}
        sx={{
          flex: 1,
          "& .MuiTabs-flexContainerVertical": { gap: 0.25, px: 1.5 },
          // hide default scrollbar
          "& .MuiTabs-scroller": { overflow: "visible !important" },
        }}
      >
        {STEPS.map(({ label, Icon, value }, idx) => {
          const stepNum = idx + 1;
          const isActive = activeStep === value;
          const isDone = parseInt(activeStep) > stepNum;

          return (
            <Tab
              key={value}
              value={value}
              icon={
                <Icon
                  sx={{
                    fontSize: 18,
                    color: isActive
                      ? "primary.main"
                      : isDone
                        ? "success.main"
                        : "text.disabled",
                  }}
                />
              }
              iconPosition="start"
              label={
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: isActive ? 700 : 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    lineHeight: 1.3,
                    color: isActive ? "#2563EB" : "#64748B",
                    opacity: !isActive && !isDone ? 0.5 : 1,
                  }}
                >
                  {label}
                </span>
              }
              disableRipple
              sx={{
                minHeight: 48,
                justifyContent: "flex-start",
                gap: 1,
                px: 1,
                borderRadius: 2,
                bgcolor: isActive ? "#EFF6FF" : "transparent",
                "&.Mui-selected": { color: "primary.main" },
                "&:hover": {
                  bgcolor: isActive ? "#EFF6FF" : "grey.50",
                },
                transition: "background-color 0.2s",
              }}
            />
          );
        })}
      </TabList>
    </Box>
  );
}
