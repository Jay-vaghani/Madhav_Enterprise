import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Place, InfoOutlined } from "@mui/icons-material";
import { useRegistration } from "../context/RegistrationContext";

export default function FinancialInformationStep() {
  const { formData, updateFormData, pickupPoints, settingsLoading, settingsError } = useRegistration();

  const { control, watch } = useForm({
    defaultValues: {
      pickupPoint: formData.pickupPoint,
    },
  });

  // Sync to global context
  useEffect(() => {
    const { unsubscribe } = watch((value) => updateFormData(value));
    return unsubscribe;
  }, [watch, updateFormData]);

  const selectedPickup = watch("pickupPoint");
  const baseFee = selectedPickup ? selectedPickup.fee : 0;
  const formattedFee = baseFee.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Box>
      <Grid container spacing={{ xs: 4, lg: 6 }}>
        {/* ── LEFT COLUMN: Information and Selection ── */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Box sx={{ mb: 4 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: 1.2,
              }}
            >
              Select your{" "}
              <Box component="span" sx={{ color: "#2563EB" }}>
                Pickup Point.
              </Box>
            </h1>
            <p
              style={{
                marginTop: "12px",
                marginBottom: 0,
                fontSize: "1rem",
                color: "#64748B",
                maxWidth: 500,
                lineHeight: 1.6,
              }}
            >
              Select your nearest pickup point. Fee is calculated automatically
              based on your pickup point.
            </p>
          </Box>

          <Box sx={{ position: "relative" }}>
            {/* Location pin icon overlay — doesn't interfere with Autocomplete internals */}
            <Place
              sx={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#2563EB",
                fontSize: 20,
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
            <Controller
              name="pickupPoint"
              control={control}
              rules={{ required: "Pickup point is required" }}
              render={({ field, fieldState }) => (
                <Autocomplete
                  options={pickupPoints}
                  value={field.value}
                  getOptionLabel={(option) => option?.label ?? ""}
                  isOptionEqualToValue={(option, val) => option?.id === val?.id}
                  onChange={(_, selected) => field.onChange(selected)}
                  onBlur={field.onBlur}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search Pickup Point..."
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          bgcolor: "#F8FAFC",
                          pl: "36px", // indent text to make room for the icon
                          "& fieldset": { borderColor: "#E2E8F0" },
                          "&:hover fieldset": { borderColor: "#CBD5E1" },
                          "&.Mui-focused fieldset": { borderColor: "#2563EB" },
                        },
                      }}
                    />
                  )}
                />
              )}
            />
          </Box>

          {/* ── SELECTED PICKUP CARD — shown after selection ── */}
          {settingsLoading && (
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Loading pickup points...
              </Typography>
            </Box>
          )}

          {settingsError && (
            <Box
              sx={{
                mt: 2,
                bgcolor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "12px",
                px: 2,
                py: 1.5,
              }}
            >
              <Typography variant="body2" color="error">
                {settingsError}
              </Typography>
            </Box>
          )}

          {selectedPickup && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "#F0F4FF",
                borderRadius: "12px",
                borderLeft: "4px solid #2563EB",
                px: 2.5,
                py: 2,
                transition: "all 0.3s ease",
                animation: "fadeIn 0.25s ease",
                "@keyframes fadeIn": {
                  from: { opacity: 0, transform: "translateY(-6px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {/* Left: name + time */}
              <Box>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "#0F172A",
                  }}
                >
                  {selectedPickup.label}
                </p>
              </Box>

              {/* Right: fee badge */}
              <Box
                sx={{
                  bgcolor: "#2563EB",
                  color: "#fff",
                  borderRadius: "99px",
                  px: 2,
                  py: 0.75,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  ml: 2,
                }}
              >
                ₹{" "}
                {selectedPickup.fee.toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                })}
              </Box>
            </Box>
          )}
        </Grid>

        {/* ── RIGHT COLUMN: Payment Summary ── */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: "1px solid",
              borderColor: "grey.100",
              boxShadow: "0 10px 40px rgba(37,99,235,0.05)",
              mb: 3,
            }}
          >
            <CardContent sx={{ p: { xs: 3, lg: 4 } }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#0F172A", mb: 3 }}
              >
                Payment Summary
              </Typography>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}
              >
                <Typography sx={{ color: "#64748B", fontWeight: 500 }}>
                  Base Route Fee
                </Typography>
                <Typography sx={{ color: "#0F172A", fontWeight: 700 }}>
                  ₹ {formattedFee}
                </Typography>
              </Box>

              {/* Removing Transport Insurance & Registration Fee as requested */}

              <Box sx={{ mt: 3 }}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    mb: 1,
                  }}
                >
                  AMOUNT TO BE PAID
                </Typography>
                <Typography
                  sx={{
                    fontSize: "2.49rem",
                    fontWeight: 800,
                    color: "#2563EB",
                    lineHeight: 1,
                  }}
                >
                  ₹ {formattedFee}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              bgcolor: "#EFF6FF",
              p: 2.5,
              borderRadius: "16px",
            }}
          >
            <InfoOutlined sx={{ color: "#2563EB", mt: 0.2 }} />
            <Typography
              sx={{ fontSize: "0.85rem", color: "#1E3A8A", lineHeight: 1.5 }}
            >
              Transport fees are calculated on an annual basis depending on the
              distance of the pickup point from the campus.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
