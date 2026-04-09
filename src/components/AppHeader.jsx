import React from "react";
import { Box } from "@mui/material";
import { AccountBalanceRounded } from "@mui/icons-material";

export default function AppHeader() {
  return (
    <Box
      component="header"
      sx={{
        height: 64,
        px: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "grey.100",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 12px rgba(37,99,235,0.06)",
      }}
    >
      <span
        style={{
          fontWeight: 800,
          fontSize: "1.15rem",
          color: "#0F172A",
        }}
      >
        Madhav Enterprise
      </span>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          component="button"
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1.5px solid",
            borderColor: "grey.200",
            bgcolor: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            "&:hover": { bgcolor: "grey.50" },
          }}
        >
          <AccountBalanceRounded
            sx={{ fontSize: 18, color: "text.secondary" }}
          />
        </Box>

        <Box
          sx={{
            height: 36,
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            display: "flex",
            padding: "0 10px",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderRadius: "8px",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>
            KPGU
          </span>
        </Box>
      </Box>
    </Box>
  );
}
