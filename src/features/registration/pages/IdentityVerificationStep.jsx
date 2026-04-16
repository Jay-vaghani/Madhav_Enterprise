import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  FormControl,
  FormHelperText,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  useMediaQuery,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { School, Search } from "@mui/icons-material";
import { DEPARTMENTS, SHIFTS, YEARS } from "../utils/data";
import { useRegistration } from "../context/RegistrationContext";

// ── Uppercase field label style ───────────────────────────────
const fieldLabel = {
  margin: "0 0 6px 0",
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "#64748B",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

export default function IdentityVerificationStep() {
  const { formData, updateFormData } = useRegistration();

  const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      enrollmentNumber: formData.enrollmentNumber,
      year: formData.year,
      semester: formData.semester,
      department: formData.department,
      shift: formData.shift,
    },
  });

  const watchedYear = watch("year");
  const isMobile = useMediaQuery("(max-width: 600px)");

  // ── Auto-set semester when year changes ──────────────────────
  useEffect(() => {
    if (watchedYear) {
      const yearData = YEARS.find((y) => y.value === watchedYear);
      if (yearData) setValue("semester", yearData.autoSemester);
    } else {
      setValue("semester", "");
    }
  }, [watchedYear, setValue]);

  // ── Sync every field change to global context ─────────────────
  useEffect(() => {
    const { unsubscribe } = watch((value) => updateFormData(value));
    return unsubscribe;
  }, [watch, updateFormData]);

  const onSubmit = (data) => {
    console.log("Identity verification data:", data);
  };

  return (
    <Box>
      {/* ── HEADLINE ── */}
      <Box sx={{ mb: 3 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 400,
            color: "#0F172A",
            lineHeight: 1.2,
          }}
        >
          Verify your academic
        </h1>
        <h1
          style={{
            margin: "0 0 12px 0",
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 800,
            color: "#2563EB",
            lineHeight: 1.2,
          }}
        >
          standing.
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
          Your bus scheduling depends on your department and shift. Ensure
          details match your ID card.
        </p>
      </Box>

      {/* ── FORM CARD ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "grey.100",
          boxShadow: "0 4px 24px rgba(37,99,235,0.06)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, lg: 3.5 } }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              {/* ── ENROLLMENT NUMBER ───────────────────────────── */}
              <Grid size={{ xs: 12 }}>
                <p style={fieldLabel}>Enrollment Number</p>
                <Controller
                  name="enrollmentNumber"
                  control={control}
                  rules={{ required: "Enrollment number is required" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      slotProps={{
                        htmlInput: {
                          autoCapitalize: "characters",
                          autoComplete: "off",
                        },
                        input: {
                          sx: { height: 52, borderRadius: "10px" },
                          endAdornment: (
                            <InputAdornment position="end">
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  px: 1.5,
                                  py: 0.75,
                                  borderRadius: 99,
                                  bgcolor: "#EFF6FF",
                                  border: "1px solid",
                                  borderColor: "primary.light",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  transition: "all 0.2s",
                                  "&:hover": { bgcolor: "#DBEAFE" },
                                }}
                              >
                                <School
                                  sx={{ fontSize: 13, color: "primary.main" }}
                                />
                                <p
                                  style={{
                                    display: `${isMobile ? "none" : "block"}`,
                                    margin: 0,
                                    fontSize: "0.6rem",
                                    fontWeight: 700,
                                    color: "#2563EB",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                  }}
                                >
                                  Enrollment Number
                                </p>
                              </Box>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* ── YEAR OF STUDY (Select) ──────── */}
              <Grid size={{ xs: 12, md: 6 }}>
                <p style={fieldLabel}>Year of Study</p>
                <Controller
                  name="year"
                  control={control}
                  rules={{ required: "Year of study is required" }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <Select
                        {...field}
                        displayEmpty
                        sx={{ borderRadius: "10px", height: 52 }}
                        renderValue={(value) =>
                          value ? (
                            YEARS.find((y) => y.value === value)?.label
                          ) : (
                            <span style={{ color: "#94A3B8" }}>
                              Select year
                            </span>
                          )
                        }
                      >
                        {YEARS.map((y) => (
                          <MenuItem key={y.value} value={y.value}>
                            {y.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <FormHelperText>
                          {fieldState.error.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* ── SEMESTER (auto-set, locked) ──────────────────── */}
              <Grid size={{ xs: 12, md: 6 }}>
                <p style={fieldLabel}>Semester</p>
                <Controller
                  name="semester"
                  control={control}
                  render={({ field }) => {
                    const yearData = YEARS.find((y) => y.value === watchedYear);
                    const semesters = yearData?.semesters || [];
                    const semLabel =
                      semesters.find((s) => s.value === field.value)?.label ??
                      null;

                    return (
                      <FormControl fullWidth disabled>
                        <Select
                          value={field.value || ""}
                          displayEmpty
                          disabled
                          sx={{
                            borderRadius: "10px",
                            height: 52,
                            "& .Mui-disabled": {
                              WebkitTextFillColor: semLabel
                                ? "#0F172A"
                                : "#94A3B8",
                              opacity: "1 !important",
                            },
                          }}
                          renderValue={() =>
                            semLabel ?? (
                              <span style={{ color: "#94A3B8" }}>Auto-set</span>
                            )
                          }
                        >
                          {semesters.map((s) => (
                            <MenuItem key={s.value} value={s.value}>
                              {s.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    );
                  }}
                />
              </Grid>

              {/* ── DEPARTMENT (Searchable — Select style) ────────── */}
              <Grid size={{ xs: 12 }}>
                <p style={fieldLabel}>Department</p>
                <Controller
                  name="department"
                  control={control}
                  rules={{ required: "Department is required" }}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      options={DEPARTMENTS}
                      value={field.value}
                      getOptionLabel={(option) => option?.label ?? ""}
                      isOptionEqualToValue={(option, val) =>
                        option?.id === val?.id
                      }
                      onChange={(_, selected) => {
                        field.onChange(selected);
                        if (selected?.defaultShift) {
                          setValue("shift", selected.defaultShift);
                        }
                      }}
                      onBlur={field.onBlur}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select department..."
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              height: 52,
                              borderRadius: "10px",
                            },
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {/* ── ACADEMIC SHIFT (3 selectable cards) ─────────── */}
              <Grid size={{ xs: 12 }}>
                <p style={fieldLabel}>Academic Shift</p>
                <Controller
                  name="shift"
                  control={control}
                  rules={{ required: "Please select an academic shift" }}
                  render={({ field, fieldState }) => (
                    <>
                      <Grid container spacing={2}>
                        {SHIFTS.map((shift) => {
                          const isSelected = field.value === shift.id;
                          return (
                            <Grid key={shift.id} size={{ xs: 12, lg: 4 }}>
                              <Box
                                onClick={() => field.onChange(shift.id)}
                                sx={{
                                  border: "1.5px solid",
                                  borderColor: isSelected
                                    ? "primary.main"
                                    : "grey.200",
                                  borderRadius: 2,
                                  p: { xs: 1.5, lg: 2 },
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: "pointer",
                                  bgcolor: isSelected
                                    ? "#EFF6FF"
                                    : "background.paper",
                                  userSelect: "none",
                                  WebkitTapHighlightColor: "transparent",
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    borderColor: "primary.main",
                                    bgcolor: "#F8FAFF",
                                  },
                                }}
                              >
                                {/* Left: emoji + label + time */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "1.4rem",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {shift.emoji}
                                  </span>
                                  <div>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
                                        color: "#0F172A",
                                      }}
                                    >
                                      {shift.label}
                                    </p>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: "0.75rem",
                                        color: "#64748B",
                                      }}
                                    >
                                      Starts {shift.time}
                                    </p>
                                  </div>
                                </Box>

                                {/* Right: radio circle */}
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    border: "2px solid",
                                    borderColor: isSelected
                                      ? "primary.main"
                                      : "grey.300",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    transition: "border-color 0.2s",
                                  }}
                                >
                                  {isSelected && (
                                    <Box
                                      sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        bgcolor: "primary.main",
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>

                      {fieldState.error && (
                        <p
                          style={{
                            margin: "6px 0 0 14px",
                            fontSize: "0.75rem",
                            color: "#EF4444",
                          }}
                        >
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
