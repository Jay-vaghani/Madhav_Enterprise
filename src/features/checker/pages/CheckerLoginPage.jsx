import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { DirectionsBus, LoginOutlined } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { checkerLogin } from "../../../api/checker/api";

// Helper to get cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export default function CheckerLoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm({
    defaultValues: { pin: "" },
  });

  useEffect(() => {
    if (getCookie("checkerToken")) {
      navigate("/checker/verify", { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await checkerLogin(data.pin);
      if (res.success && res.token) {
        // Store cookie with 2 days expiration
        const d = new Date();
        d.setTime(d.getTime() + (2 * 24 * 60 * 60 * 1000));
        document.cookie = `checkerToken=${res.token};expires=${d.toUTCString()};path=/`;
        navigate("/checker/verify", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Invalid PIN. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F1F5F9",
        fontFamily: '"Inter", "Roboto", sans-serif',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 400,
          width: "100%",
          p: { xs: 4, md: 5 },
          borderRadius: "24px",
          border: "1px solid",
          borderColor: "grey.100",
          boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              bgcolor: "#10B981", // Green theme for checker
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              boxShadow: "0 8px 24px rgba(16,185,129,0.25)",
            }}
          >
            <DirectionsBus sx={{ fontSize: 32, color: "#fff" }} />
          </Box>
          <h1
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#0F172A",
            }}
          >
            Bus Checker
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.85rem",
              color: "#64748B",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Authentication
          </p>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: "12px",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ mb: 3.5 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#334155",
              }}
            >
              Checker PIN
            </p>
            <Controller
              name="pin"
              control={control}
              rules={{ required: "PIN is required" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="tel"
                  placeholder="Enter PIN"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      autoFocus: true,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 52,
                      borderRadius: "12px",
                      bgcolor: "#F8FAFC",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                         borderColor: "#10B981",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                         borderColor: "#10B981",
                         borderWidth: 2,
                      },
                    },
                  }}
                />
              )}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disableElevation
            startIcon={<LoginOutlined />}
            sx={{
              py: 1.5,
              borderRadius: "12px",
              bgcolor: "#10B981",
              fontSize: "1rem",
              fontWeight: 700,
              textTransform: "none",
              height: 52,
              boxShadow: "0 4px 16px rgba(16,185,129,0.25)",
              "&:hover": { bgcolor: "#059669" },
            }}
          >
            Verify
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
