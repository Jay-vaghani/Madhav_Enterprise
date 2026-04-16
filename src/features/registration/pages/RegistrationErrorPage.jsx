import React from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import {
  ErrorOutlineOutlined,
  Refresh,
  PhotoCamera,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

export default function RegistrationErrorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const errorMessage =
    location.state?.message ||
    "An unknown error occurred during registration. Please try again.";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F8FAFC",
        p: 3,
        fontFamily: '"Inter", "Roboto", sans-serif',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 550,
          width: "100%",
          p: { xs: 4, md: 5 },
          borderRadius: "24px",
          border: "1px solid",
          borderColor: "grey.100",
          boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <ErrorOutlineOutlined sx={{ fontSize: 40, color: "#EF4444" }} />
        </Box>

        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: "#0F172A", mb: 2 }}
        >
          Registration Failed
        </Typography>

        <Typography
          sx={{ color: "#64748B", mb: 4, lineHeight: 1.6, fontSize: "1.05rem" }}
        >
          We encountered an issue while processing your registration. Please
          take a <strong style={{ color: "#0F172A" }}>screenshot</strong> of
          this page and share it with the administration so we can resolve the
          problem immediately.
        </Typography>

        <Box
          sx={{
            bgcolor: "#F1F5F9",
            p: 3,
            borderRadius: "12px",
            mb: 4,
            borderLeft: "4px solid #EF4444",
            textAlign: "left",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#64748B",
              mb: 1,
              textTransform: "uppercase",
            }}
          >
            Error Details
          </Typography>
          <Typography
            sx={{
              color: "#1E293B",
              fontFamily: "monospace",
              wordBreak: "break-word",
              fontSize: "0.95rem",
            }}
          >
            {errorMessage}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => navigate("/")}
            sx={{
              py: 1.5,
              borderRadius: "12px",
              bgcolor: "#0F172A",
              color: "#ffffffff",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1rem",
              "&:hover": { bgcolor: "#ffffffff", color: "#0F172A" },
            }}
          >
            Go Back & Try Again
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
