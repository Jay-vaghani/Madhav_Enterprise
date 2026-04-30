import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Box, Card, CardContent, TextField } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Call, Gavel, Lock } from "@mui/icons-material";
import { useRegistration } from "../context/RegistrationContext";

const TRUST_ITEMS = [
  {
    Icon: Lock,
    title: "SECURE DATA",
    desc: "Your personal information is only used for transportation purposes.",
  },
  {
    Icon: Call,
    title: "NEED HELP?",
    desc: "call us at +91 8347125664 for any queries. regarding bus service.",
  },
  {
    Icon: Gavel,
    title: "TERMS & CONDITIONS",
    desc: "Review our terms and conditions before submitting the form.",
  },
];

export default function PersonalDetailsStep() {
  const { formData, updateFormData } = useRegistration();

  const { control, watch } = useForm({
    defaultValues: {
      fullName: formData.fullName,
      email: formData.email,
      mobile: formData.mobile,
      guardianMobile: formData.guardianMobile,
      pinCode: formData.pinCode,
      permanentAddress: formData.permanentAddress,
    },
  });

  // Sync every change to global context in real time
  useEffect(() => {
    const { unsubscribe } = watch((value) => updateFormData(value));
    return unsubscribe;
  }, [watch, updateFormData]);

  const fieldSx = {
    "& .MuiOutlinedInput-root": { height: 52, borderRadius: "10px" },
  };
  const areaSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px" } };

  const handleMobileChange = (e, onChange) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.startsWith("91") && val.length > 10) {
      val = val.substring(2);
    } else if (val.startsWith("0") && val.length > 10) {
      val = val.substring(1);
    }
    if (val.length > 10) val = val.substring(0, 10);
    onChange(val);
  };

  return (
    <Box>
      {/* Headline */}
      <Box sx={{ mb: 3 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(1.5rem,4vw,2rem)",
            fontWeight: 400,
            color: "#0F172A",
            lineHeight: 1.2,
          }}
        >
          Start your
        </h1>
        <h1
          style={{
            margin: "0 0 12px 0",
            fontSize: "clamp(1.5rem,4vw,2rem)",
            fontWeight: 800,
            color: "#2563EB",
            lineHeight: 1.2,
          }}
        >
          Journey with us.
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "0.95rem",
            color: "#64748B",
            maxWidth: 600,
            lineHeight: 1.6,
          }}
        >
          Please provide your personal information exactly as it appears on your
          official identification documents.
        </p>
      </Box>

      {/* Form Card */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "grey.100",
          boxShadow: "0 4px 24px rgba(37,99,235,0.06)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, lg: 3.5 } }}>
          <Grid container spacing={2.5}>
            {/* Full Name (as per Aadhaar) */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="fullName"
                control={control}
                rules={{ required: "Full name is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Full Name (as per Aadhaar card)"
                    placeholder="Enter your full name exactly as on Aadhaar"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    sx={fieldSx}
                    slotProps={{
                      htmlInput: {
                        autoComplete: "name",
                        inputMode: "text",
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Email + Mobile */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Controller
                name="email"
                control={control}
                rules={{
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    sx={fieldSx}
                    slotProps={{
                      htmlInput: {
                        autoComplete: "email",
                        inputMode: "email",
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Controller
                name="mobile"
                control={control}
                rules={{
                  required: "Student mobile is required",
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message:
                      "Invalid mobile number. Please enter 10 digits Number",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="tel"
                    label="Student Mobile Number"
                    placeholder="+91 00000 00000"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    sx={fieldSx}
                    onChange={(e) => handleMobileChange(e, field.onChange)}
                    slotProps={{
                      htmlInput: {
                        autoComplete: "tel",
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                        maxLength: 14,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Guardian Mobile + Pin Code */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Controller
                name="guardianMobile"
                control={control}
                rules={{
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message:
                      "Invalid mobile number. Please enter 10 digits Number",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="tel"
                    label="Parent / Guardian Mobile"
                    placeholder="+91 00000 00000"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    sx={fieldSx}
                    onChange={(e) => handleMobileChange(e, field.onChange)}
                    slotProps={{
                      htmlInput: {
                        autoComplete: "tel",
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                        maxLength: 14,
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Controller
                name="pinCode"
                control={control}
                rules={{
                  required: "PIN code is required",
                  pattern: {
                    value: /^\d{6}$/,
                    message: "Must be exactly 6 digits",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="PIN Code"
                    placeholder="6-digit PIN"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    sx={fieldSx}
                    slotProps={{
                      htmlInput: {
                        maxLength: 6,
                        autoComplete: "postal-code",
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    }}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      field.onChange(val.substring(0, 6));
                    }}
                  />
                )}
              />
            </Grid>

            {/* Permanent Address */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="permanentAddress"
                control={control}
                rules={{ required: "Address is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Permanent Address"
                    placeholder="Enter your full residential address..."
                    multiline
                    rows={3}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    sx={areaSx}
                    slotProps={{
                      htmlInput: {
                        autoComplete: "street-address",
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Trust Signals */}
      <Grid container spacing={2.5}>
        {TRUST_ITEMS.map(({ Icon, title, desc }) => (
          <Grid key={title} size={{ xs: 12, lg: 4 }}>
            <Box
              sx={{
                bgcolor: "background.paper",
                borderRadius: 2.5,
                p: 2.5,
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                border: "1px solid",
                borderColor: "grey.100",
                boxShadow: "0 2px 12px rgba(37,99,235,0.05)",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 18, color: "#fff" }} />
              </Box>
              <div>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#2563EB",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    color: "#64748B",
                    lineHeight: 1.5,
                  }}
                >
                  {desc}
                </p>
              </div>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
