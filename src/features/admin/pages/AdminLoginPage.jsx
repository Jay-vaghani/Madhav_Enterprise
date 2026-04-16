import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  DirectionsBus,
  LoginOutlined,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginAdmin } from "../../../api/admin/api";

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm({
    defaultValues: { username: "", password: "" },
  });

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated) navigate("/admin/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await loginAdmin(data.username, data.password);
      login(res.token, res.user);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please check your connection and try again."
      );
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
          maxWidth: 440,
          width: "100%",
          p: { xs: 4, md: 5 },
          borderRadius: "24px",
          border: "1px solid",
          borderColor: "grey.100",
          boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo Area */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              bgcolor: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
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
            Transport Portal
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
            Admin Panel
          </p>
        </Box>

        {/* Error Alert */}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ mb: 2.5 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#334155",
              }}
            >
              Username
            </p>
            <Controller
              name="username"
              control={control}
              rules={{ required: "Username is required" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  placeholder="Enter your username"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      autoComplete: "username",
                      autoFocus: true,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 52,
                      borderRadius: "12px",
                      bgcolor: "#F8FAFC",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#2563EB",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#2563EB",
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              )}
            />
          </Box>

          <Box sx={{ mb: 3.5 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#334155",
              }}
            >
              Password
            </p>
            <Controller
              name="password"
              control={control}
              rules={{ required: "Password is required" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      autoComplete: "current-password",
                    },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? (
                              <VisibilityOff sx={{ fontSize: 20, color: "#94A3B8" }} />
                            ) : (
                              <Visibility sx={{ fontSize: 20, color: "#94A3B8" }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 52,
                      borderRadius: "12px",
                      bgcolor: "#F8FAFC",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#2563EB",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#2563EB",
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
            disabled={isSubmitting}
            disableElevation
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                <LoginOutlined />
              )
            }
            sx={{
              py: 1.5,
              borderRadius: "12px",
              bgcolor: "#2563EB",
              fontSize: "1rem",
              fontWeight: 700,
              textTransform: "none",
              height: 52,
              boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
              "&:hover": { bgcolor: "#1D4ED8" },
              "&:disabled": { bgcolor: "#93C5FD", color: "#fff" },
            }}
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p
          style={{
            margin: "24px 0 0",
            textAlign: "center",
            fontSize: "0.8rem",
            color: "#94A3B8",
          }}
        >
          Madhav Enterprise — College Bus Management
        </p>
      </Paper>
    </Box>
  );
}
