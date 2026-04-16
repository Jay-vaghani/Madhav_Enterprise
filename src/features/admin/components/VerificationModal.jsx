import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  MenuItem,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Alert,
  Skeleton,
  Autocomplete,
  FormControl,
  Select,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  CameraAltOutlined,
  AccountBalanceOutlined,
  AccountBalanceWalletOutlined,
  CloseOutlined,
  ReceiptLongOutlined,
  CropOutlined,
  AddOutlined,
  RemoveOutlined,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import {
  approveStudent,
  rejectStudent,
  fetchPaymentStats,
} from "../../../api/admin/api";
import ImageCropModal from "../../../components/ImageCropModal";
import {
  DEPARTMENTS,
  PICKUP_POINTS,
  SHIFTS,
  YEARS,
} from "../../registration/utils/data";

// ── Compress a base64/blob-URL image to WEBP ≤ 50 KB (browser canvas) ────
async function compressToWebpUnder50KB(base64Input, maxKB = 50) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Resize to max 600px on longest side
      const MAX_DIM = 600;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Progressively reduce WEBP quality until under maxKB
      let quality = 0.85;
      const tryEncode = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob failed"));
              return;
            }
            if (blob.size <= maxKB * 1024 || quality <= 0.05) {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            } else {
              quality = Math.max(0.05, quality - 0.1);
              tryEncode();
            }
          },
          "image/webp",
          quality,
        );
      };
      tryEncode();
    };
    img.onerror = reject;
    img.src = base64Input;
  });
}

// ── Quick-select validity dates ────────────────────────────────
const VALIDITY_DATES = [
  "30/04/2026",
  "30/06/2026",
  "31/07/2026",
  "31/08/2026",
  "30/09/2026",
  "31/10/2026",
  "31/12/2026",
];

// Convert DD/MM/YYYY to YYYY-MM-DD for input[type=date]
const toInputDate = (ddmmyyyy) => {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}-${m}-${d}`;
};

// Format currency
const formatCurrency = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// ── Shared input style ─────────────────────────────────────────
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    bgcolor: "#F8FAFC",
    fontSize: "0.85rem",
  },
};
const labelSx = {
  margin: "0 0 4px 0",
  fontSize: "0.62rem",
  fontWeight: 700,
  color: "#2563EB",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};
const sectionSx = {
  margin: "0 0 6px 0",
  fontSize: "0.68rem",
  fontWeight: 800,
  color: "#64748B",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function VerificationModal({
  open,
  student,
  onClose,
  onActionComplete,
  onReceiptReady,
}) {
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPhotoBase64, setNewPhotoBase64] = useState(null);
  const [compressing, setCompressing] = useState(false);

  // Crop state
  const [cropSrc, setCropSrc] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);

  // Payment stats
  const [paymentStats, setPaymentStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Action state
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState("");
  const [showTransaction2, setShowTransaction2] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      guardianMobile: "",
      pinCode: "",
      permanentAddress: "",
      enrollmentNumber: "",
      year: "",
      semester: "",
      department: null,
      shift: "",
      pickupPoint: null,
      paymentMode: "cash",
      settlementAccount: "A",
      transaction1: "",
      transaction2: "",
      feeAmount: "",
      cashAmount: "",
      bankAmount: "",
      validityDate: "",
      remarks: "",
    },
  });

  const watchedYear = watch("year");
  const watchedValidityDate = watch("validityDate");
  const watchedPaymentMode = watch("paymentMode");
  const watchedDepartment = watch("department");
  const watchedPickupPoint = watch("pickupPoint");

  // Auto-set semester when year changes
  useEffect(() => {
    if (watchedYear) {
      const yearData = YEARS.find((y) => y.value === watchedYear);
      if (yearData) setValue("semester", yearData.autoSemester);
    }
  }, [watchedYear, setValue]);

  // Auto-set shift when department changes
  useEffect(() => {
    if (watchedDepartment?.defaultShift) {
      setValue("shift", watchedDepartment.defaultShift);
    }
  }, [watchedDepartment, setValue]);

  // Auto-set fee when pickup point changes
  useEffect(() => {
    if (watchedPickupPoint?.fee) {
      setValue("feeAmount", watchedPickupPoint.fee);
    }
  }, [watchedPickupPoint, setValue]);

  // Reset form when student changes
  useEffect(() => {
    if (student) {
      // Find matching department/pickupPoint objects from data
      const deptObj =
        DEPARTMENTS.find((d) => d.id === student.department?.id) ||
        student.department ||
        null;
      const ppObj =
        PICKUP_POINTS.find((p) => p.id === student.pickupPoint?.id) ||
        student.pickupPoint ||
        null;

      reset({
        fullName: student.fullName || "",
        email: student.email || "",
        mobile: student.mobile || "",
        guardianMobile: student.guardianMobile || "",
        pinCode: student.pinCode || "",
        permanentAddress: student.permanentAddress || "",
        enrollmentNumber: student.enrollmentNumber || "",
        year: student.year || "",
        semester: student.semester || "",
        department: deptObj,
        shift: student.shift || "",
        pickupPoint: ppObj,
        paymentMode: "cash",
        settlementAccount: "A",
        transaction1: "",
        transaction2: "",
        feeAmount: ppObj?.fee || "",
        cashAmount: "",
        bankAmount: "",
        validityDate: "",
        remarks: "",
      });
      setPhotoPreview(student.photoUrl || null);
      setNewPhotoBase64(null);
      setShowTransaction2(false);
      setError("");
    }
  }, [student, reset]);

  // Fetch payment stats when modal opens
  useEffect(() => {
    if (open && token) {
      setStatsLoading(true);
      fetchPaymentStats(token)
        .then((res) => setPaymentStats(res.data))
        .catch(() => {})
        .finally(() => setStatsLoading(false));
    }
  }, [open, token]);

  // ── Photo handling: Step 1 → open crop modal ────────────────
  const handlePhotoFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);
  }, []);

  // Step 2: After crop → compress to WEBP ≤50KB using canvas → save
  const handleCropComplete = useCallback(async (croppedBase64) => {
    setCropOpen(false);
    setCropSrc(null);
    setCompressing(true);

    try {
      const finalBase64 = await compressToWebpUnder50KB(croppedBase64);
      const resp = await fetch(finalBase64);
      const blob = await resp.blob();
      setPhotoPreview(URL.createObjectURL(blob));
      setNewPhotoBase64(finalBase64);
    } catch (err) {
      console.error("Crop/compress failed:", err);
    } finally {
      setCompressing(false);
    }
  }, []);

  // ── Submit: Approve & Generate Receipt ──────────────────────
  const onSubmit = async (data) => {
    // react-hook-form rules handle required field validation via helperText.
    // Additional cross-field validation:
    if (data.paymentMode === "both") {
      const cash = Number(data.cashAmount) || 0;
      const bank = Number(data.bankAmount) || 0;
      const fee = Number(data.feeAmount) || 0;
      if (cash + bank !== fee) {
        setError(`Cash (₹${cash}) + Bank (₹${bank}) must equal Fee (₹${fee}).`);
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...data,
        feeAmount: Number(data.feeAmount),
        cashAmount:
          data.paymentMode === "both" ? Number(data.cashAmount) : undefined,
        bankAmount:
          data.paymentMode === "both" ? Number(data.bankAmount) : undefined,
        transaction1: data.transaction1?.trim() || undefined,
        transaction2: data.transaction2?.trim() || undefined,
        newPhotoBase64: newPhotoBase64 || undefined,
      };
      // Remove old field if it leaked
      delete payload.transactionId;
      const res = await approveStudent(token, student._id, payload);
      // Pass receipt data to parent before closing
      if (res.receiptData) {
        onReceiptReady?.(res.receiptData);
      }
      onActionComplete?.("approved", res.data);
    } catch (err) {
      setError(err.message || "Failed to approve student");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reject ──────────────────────────────────────────────────
  const handleReject = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reject this registration? This action cannot be undone.",
      )
    )
      return;
    setRejecting(true);
    setError("");

    try {
      await rejectStudent(token, student._id);
      onActionComplete?.("rejected");
    } catch (err) {
      setError(err.message || "Failed to reject student");
    } finally {
      setRejecting(false);
    }
  };

  if (!student) return null;

  // Build semester display
  const yearData = YEARS.find((y) => y.value === watchedYear);
  const semLabel =
    yearData?.semesters?.find((s) => s.value === watch("semester"))?.label ||
    watch("semester") ||
    "";

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              borderRadius: { xs: 0, sm: "16px" },
              maxHeight: { xs: "100vh", sm: "92vh" },
              margin: { xs: 0, sm: undefined },
              width: { xs: "100%", sm: undefined },
              overflow: "hidden",
            },
          },
        }}
      >
        {/* ── Top Bar ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: "1px solid #E2E8F0",
            bgcolor: "#FAFBFC",
          }}
        >
          <Box>
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#0F172A",
              }}
            >
              Verification Details
            </h2>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "0.78rem",
                color: "#94A3B8",
              }}
            >
              Student Registration Entry
            </p>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip
              label="STATUS: PENDING"
              size="small"
              sx={{
                bgcolor: "#FEF3C7",
                color: "#92400E",
                fontWeight: 700,
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
              }}
            />
            <IconButton onClick={onClose} size="small">
              <CloseOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 0, overflow: "auto" }}>
          <Grid container sx={{ minHeight: 500 }}>
            {/* ════════════════ LEFT COLUMN ════════════════ */}
            <Grid
              size={{ xs: 12, md: 8 }}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRight: { md: "1px solid #E2E8F0" },
              }}
            >
              {/* ── Photo Section ── */}
              <Box
                sx={{
                  bgcolor: "#EFF6FF",
                  borderRadius: "14px",
                  p: 2.5,
                  mb: 3,
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "center", sm: "flex-start" },
                  gap: 2.5,
                }}
              >
                <Box sx={{ position: "relative" }}>
                  {compressing ? (
                    <Box
                      sx={{
                        width: 150,
                        height: 150,
                        borderRadius: "14px",
                        bgcolor: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CircularProgress size={28} />
                    </Box>
                  ) : (
                    <Avatar
                      src={photoPreview}
                      alt={student.fullName}
                      sx={{
                        width: 150,
                        height: 150,
                        borderRadius: "14px",
                        border: "3px solid white",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                      }}
                      variant="rounded"
                    />
                  )}
                </Box>
                <Box
                  sx={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: { xs: "center", sm: "flex-start" },
                    textAlign: { xs: "center", sm: "left" },
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 800,
                      fontSize: "calc(2.5vw + 1vh)",
                      color: "#0F172A",
                    }}
                  >
                    {student.fullName}
                  </p>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      mt: 1,
                      alignItems: "center",
                    }}
                  >
                    {photoPreview && (
                      <IconButton
                        onClick={() => {
                          setCropSrc(photoPreview);
                          setCropOpen(true);
                        }}
                        sx={{
                          bgcolor: "#10B981",
                          color: "white",
                          width: 32,
                          height: 32,
                          "&:hover": { bgcolor: "#059669" },
                          boxShadow: "0 2px 6px rgba(16,185,129,0.3)",
                        }}
                      >
                        <CropOutlined sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        bgcolor: "#2563EB",
                        color: "white",
                        width: 32,
                        height: 32,
                        "&:hover": { bgcolor: "#1D4ED8" },
                        boxShadow: "0 2px 6px rgba(37,99,235,0.3)",
                      }}
                    >
                      <CameraAltOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoFileSelect}
                    />
                  </Box>
                  {newPhotoBase64 && (
                    <Chip
                      label="New photo selected"
                      size="small"
                      color="success"
                      sx={{ mt: 0.5, height: 20, fontSize: "0.65rem" }}
                    />
                  )}
                </Box>
              </Box>

              {/* ── Student Identification ── */}
              <p style={sectionSx}>Student Identification</p>
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <p style={labelSx}>Full Name</p>
                  <Controller
                    name="fullName"
                    control={control}
                    rules={{ required: "Full name is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        error={!!errors.fullName}
                        helperText={errors.fullName?.message}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <p style={labelSx}>Enrollment Number</p>
                  <Controller
                    name="enrollmentNumber"
                    control={control}
                    rules={{ required: "Enrollment number is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        error={!!errors.enrollmentNumber}
                        helperText={errors.enrollmentNumber?.message}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* ── Academic Profile + Transport ── */}
              <Grid container spacing={3} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 12 }}>
                  <p style={sectionSx}>Academic Profile</p>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <p style={labelSx}>Year</p>
                      <Controller
                        name="year"
                        control={control}
                        rules={{ required: "Year is required" }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            size="small"
                            fullWidth
                            error={!!errors.year}
                            helperText={errors.year?.message}
                            sx={fieldSx}
                          >
                            {YEARS.map((y) => (
                              <MenuItem key={y.value} value={y.value}>
                                {y.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <p style={labelSx}>Semester</p>
                      <Controller
                        name="semester"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            size="small"
                            fullWidth
                            disabled
                            sx={{
                              ...fieldSx,
                              "& .Mui-disabled": {
                                WebkitTextFillColor: "#0F172A",
                                opacity: "1 !important",
                              },
                            }}
                            value={semLabel}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={12}>
                      <p style={labelSx}>Department</p>
                      <Controller
                        name="department"
                        control={control}
                        rules={{ required: "Department is required" }}
                        render={({ field }) => (
                          <Autocomplete
                            options={DEPARTMENTS}
                            value={field.value}
                            getOptionLabel={(o) => o?.label ?? ""}
                            isOptionEqualToValue={(o, v) => o?.id === v?.id}
                            onChange={(_, selected) => field.onChange(selected)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                placeholder="Search department..."
                                error={!!errors.department}
                                helperText={errors.department?.message}
                                sx={fieldSx}
                              />
                            )}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <p style={sectionSx}>Transport Logistics</p>
                  <Grid container spacing={1.5}>
                    {/* Shift — card-style like student form */}
                    <Grid size={12}>
                      <p style={labelSx}>Academic Shift</p>
                      <Controller
                        name="shift"
                        control={control}
                        rules={{ required: "Shift is required" }}
                        render={({ field }) => (
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                            }}
                          >
                            {SHIFTS.map((shift) => {
                              const isSelected = field.value === shift.id;
                              return (
                                <Box
                                  key={shift.id}
                                  onClick={() => field.onChange(shift.id)}
                                  sx={{
                                    border: "1.5px solid",
                                    borderColor: isSelected
                                      ? "primary.main"
                                      : "grey.200",
                                    borderRadius: 2,
                                    p: 1.25,
                                    display: "flex",
                                    flex: 1,
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    cursor: "pointer",
                                    bgcolor: isSelected
                                      ? "#EFF6FF"
                                      : "background.paper",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                      borderColor: "primary.main",
                                      bgcolor: "#F8FAFF",
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "1.1rem",
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
                                          fontSize: "0.8rem",
                                          color: "#0F172A",
                                        }}
                                      >
                                        {shift.label}
                                      </p>
                                      <p
                                        style={{
                                          margin: 0,
                                          fontSize: "0.68rem",
                                          color: "#64748B",
                                        }}
                                      >
                                        {shift.time}
                                      </p>
                                    </div>
                                  </Box>
                                  <Box
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      borderRadius: "50%",
                                      border: "2px solid",
                                      borderColor: isSelected
                                        ? "primary.main"
                                        : "grey.300",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {isSelected && (
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: "50%",
                                          bgcolor: "primary.main",
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      />
                    </Grid>
                    {/* Pickup Point — searchable autocomplete */}
                    <Grid size={12}>
                      <p style={labelSx}>Pickup Point</p>
                      <Controller
                        name="pickupPoint"
                        control={control}
                        rules={{ required: "Pickup point is required" }}
                        render={({ field }) => (
                          <Autocomplete
                            options={PICKUP_POINTS}
                            value={field.value}
                            getOptionLabel={(o) =>
                              o?.label
                                ? `${o.label} — ₹${o.fee?.toLocaleString("en-IN")}`
                                : ""
                            }
                            isOptionEqualToValue={(o, v) => o?.id === v?.id}
                            onChange={(_, selected) => field.onChange(selected)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                placeholder="Search pickup point..."
                                error={!!errors.pickupPoint}
                                helperText={errors.pickupPoint?.message}
                                sx={fieldSx}
                              />
                            )}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* ── Communication & Residential ── */}
              <p style={sectionSx}>Communication & Residential</p>
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <p style={labelSx}>Student Phone</p>
                  <Controller
                    name="mobile"
                    control={control}
                    rules={{ required: "Student phone is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        type="tel"
                        inputProps={{ inputMode: "tel" }}
                        error={!!errors.mobile}
                        helperText={errors.mobile?.message}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <p style={labelSx}>Parent Phone</p>
                  <Controller
                    name="guardianMobile"
                    control={control}
                    rules={{ required: "Parent phone is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        type="tel"
                        inputProps={{ inputMode: "tel" }}
                        error={!!errors.guardianMobile}
                        helperText={errors.guardianMobile?.message}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <p style={labelSx}>Email Address</p>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        type="email"
                        inputProps={{ inputMode: "email" }}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <p style={labelSx}>Pin Code</p>
                  <Controller
                    name="pinCode"
                    control={control}
                    rules={{ required: "Pin code is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        type="tel"
                        inputProps={{ inputMode: "numeric", maxLength: 6 }}
                        error={!!errors.pinCode}
                        helperText={errors.pinCode?.message}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <p style={labelSx}>Permanent Address</p>
                  <Controller
                    name="permanentAddress"
                    control={control}
                    rules={{ required: "Address is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        error={!!errors.permanentAddress}
                        helperText={errors.permanentAddress?.message}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* ════════════ PAYMENT AUTHORIZATION ════════════ */}
              <Box
                sx={{
                  bgcolor: "#FAFBFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  p: { xs: 2, sm: 2.5 },
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <ReceiptLongOutlined
                    sx={{ fontSize: 20, color: "#0F172A" }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      color: "#0F172A",
                    }}
                  >
                    Payment Authorization
                  </p>
                </Box>

                <Grid container spacing={2}>
                  {/* Payment Mode */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <p style={labelSx}>Payment Mode</p>
                    <Controller
                      name="paymentMode"
                      control={control}
                      render={({ field }) => (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {["cash", "bank", "both"].map((mode) => (
                            <Chip
                              key={mode}
                              label={
                                mode === "bank"
                                  ? "Bank/UPI"
                                  : mode.charAt(0).toUpperCase() + mode.slice(1)
                              }
                              onClick={() => field.onChange(mode)}
                              variant={
                                field.value === mode ? "filled" : "outlined"
                              }
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                borderRadius: "8px",
                                height: 34,
                                ...(field.value === mode
                                  ? {
                                      bgcolor: "#2563EB",
                                      color: "white",
                                      borderColor: "#2563EB",
                                    }
                                  : {
                                      borderColor: "#CBD5E1",
                                      color: "#334155",
                                    }),
                                "&:hover": {
                                  bgcolor:
                                    field.value === mode
                                      ? "#1D4ED8"
                                      : "#F1F5F9",
                                },
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    />
                  </Grid>

                  {/* Settlement Account — hidden for cash-only */}
                  {watchedPaymentMode !== "cash" && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <p style={labelSx}>Settlement Account *</p>
                      <Controller
                        name="settlementAccount"
                        control={control}
                        rules={{
                          required:
                            watchedPaymentMode !== "cash"
                              ? "Settlement account is required"
                              : false,
                        }}
                        render={({ field }) => (
                          <RadioGroup row {...field}>
                            <FormControlLabel
                              value="A"
                              control={<Radio size="small" />}
                              label={
                                <span
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  Account A
                                </span>
                              }
                            />
                            <FormControlLabel
                              value="B"
                              control={<Radio size="small" />}
                              label={
                                <span
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  Account B
                                </span>
                              }
                            />
                          </RadioGroup>
                        )}
                      />
                      {errors.settlementAccount && (
                        <p
                          style={{
                            margin: "4px 0 0 14px",
                            fontSize: "0.75rem",
                            color: "#d32f2f",
                          }}
                        >
                          {errors.settlementAccount.message}
                        </p>
                      )}
                    </Grid>
                  )}

                  {/* Transaction 1 — shown for bank & both */}
                  {(watchedPaymentMode === "bank" ||
                    watchedPaymentMode === "both") && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <p style={labelSx}>Transaction ID 1 *</p>
                        {!showTransaction2 && (
                          <IconButton
                            size="small"
                            onClick={() => setShowTransaction2(true)}
                            sx={{
                              bgcolor: "#EFF6FF",
                              color: "#2563EB",
                              width: 22,
                              height: 22,
                              "&:hover": { bgcolor: "#DBEAFE" },
                            }}
                          >
                            <AddOutlined sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                      <Controller
                        name="transaction1"
                        control={control}
                        rules={{
                          required:
                            watchedPaymentMode === "bank" ||
                            watchedPaymentMode === "both"
                              ? "Transaction ID is required"
                              : false,
                          pattern: {
                            value: /^[0-9]{12}$/,
                            message: "Must be exactly 12 numeric digits",
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            size="small"
                            fullWidth
                            type="tel"
                            placeholder="e.g. 992100452311"
                            inputProps={{ inputMode: "numeric", maxLength: 12 }}
                            error={!!errors.transaction1}
                            helperText={errors.transaction1?.message}
                            sx={fieldSx}
                          />
                        )}
                      />
                    </Grid>
                  )}

                  {/* Transaction 2 — optional, shown via "+" button */}
                  {showTransaction2 &&
                    (watchedPaymentMode === "bank" ||
                      watchedPaymentMode === "both") && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <p style={labelSx}>Transaction ID 2</p>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setShowTransaction2(false);
                              setValue("transaction2", "");
                            }}
                            sx={{
                              bgcolor: "#FEF2F2",
                              color: "#DC2626",
                              width: 22,
                              height: 22,
                              "&:hover": { bgcolor: "#FEE2E2" },
                            }}
                          >
                            <RemoveOutlined sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                        <Controller
                          name="transaction2"
                          control={control}
                          rules={{
                            pattern: {
                              value: /^[0-9]{12}$/,
                              message: "Must be exactly 12 numeric digits",
                            },
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              fullWidth
                              type="tel"
                              placeholder="Second transaction ID (optional)"
                              inputProps={{ inputMode: "numeric", maxLength: 12 }}
                              error={!!errors.transaction2}
                              helperText={errors.transaction2?.message}
                              sx={fieldSx}
                            />
                          )}
                        />
                      </Grid>
                    )}

                  {/* Fee Amount */}
                  <Grid
                    size={{
                      xs: 12,
                      sm:
                        watchedPaymentMode === "bank" ||
                        watchedPaymentMode === "both"
                          ? 6
                          : 12,
                    }}
                  >
                    <p style={labelSx}>Fee Amount (₹)</p>
                    <Controller
                      name="feeAmount"
                      control={control}
                      rules={{ required: "Fee amount is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          size="small"
                          fullWidth
                          type="tel"
                          inputProps={{ inputMode: "numeric" }}
                          error={!!errors.feeAmount}
                          helperText={errors.feeAmount?.message}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  ₹
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>

                  {/* Cash + Bank amounts — only for "both" mode */}
                  {watchedPaymentMode === "both" && (
                    <>
                      <Grid size={{ xs: 6 }}>
                        <p style={labelSx}>Cash Amount (₹) *</p>
                        <Controller
                          name="cashAmount"
                          control={control}
                          rules={{
                            required:
                              watchedPaymentMode === "both"
                                ? "Cash amount is required"
                                : false,
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              fullWidth
                              type="tel"
                              inputProps={{ inputMode: "numeric" }}
                              error={!!errors.cashAmount}
                              helperText={errors.cashAmount?.message}
                              slotProps={{
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      ₹
                                    </InputAdornment>
                                  ),
                                },
                              }}
                              sx={fieldSx}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <p style={labelSx}>Bank Amount (₹) *</p>
                        <Controller
                          name="bankAmount"
                          control={control}
                          rules={{
                            required:
                              watchedPaymentMode === "both"
                                ? "Bank amount is required"
                                : false,
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              fullWidth
                              type="tel"
                              inputProps={{ inputMode: "numeric" }}
                              error={!!errors.bankAmount}
                              helperText={errors.bankAmount?.message}
                              slotProps={{
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      ₹
                                    </InputAdornment>
                                  ),
                                },
                              }}
                              sx={fieldSx}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Validity Date */}
                  <Grid size={12}>
                    <p style={labelSx}>Validity Expiration</p>
                    <Grid
                      container
                      spacing={1.5}
                      sx={{ alignItems: "flex-start" }}
                    >
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Controller
                          name="validityDate"
                          control={control}
                          rules={{ required: "Validity date is required" }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="date"
                              size="small"
                              fullWidth
                              error={!!errors.validityDate}
                              helperText={errors.validityDate?.message}
                              sx={fieldSx}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}
                        >
                          {VALIDITY_DATES.map((d) => {
                            const isoVal = toInputDate(d);
                            const isActive = watchedValidityDate === isoVal;
                            return (
                              <Chip
                                key={d}
                                label={d}
                                size="small"
                                onClick={() => setValue("validityDate", isoVal)}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.72rem",
                                  borderRadius: "6px",
                                  height: 28,
                                  cursor: "pointer",
                                  ...(isActive
                                    ? { bgcolor: "#2563EB", color: "white" }
                                    : { bgcolor: "#F1F5F9", color: "#334155" }),
                                  "&:hover": {
                                    bgcolor: isActive ? "#1D4ED8" : "#E2E8F0",
                                  },
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Remarks */}
                  <Grid size={12}>
                    <p style={labelSx}>Remarks (Optional)</p>
                    <Controller
                      name="remarks"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="Any additional notes..."
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
              {error && (
                <Alert severity="error" sx={{ my: 2, borderRadius: "10px" }}>
                  {error}
                </Alert>
              )}
            </Grid>

            {/* ════════════════ RIGHT COLUMN ════════════════ */}
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                p: { xs: 2, sm: 3 },
                bgcolor: "#FAFBFC",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <p style={{ ...sectionSx, margin: 0 }}>Collection Metrics</p>

              {/* Account A */}
              <Box
                sx={{
                  bgcolor: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Account A (Bank)
                  </p>
                  <AccountBalanceOutlined
                    sx={{ fontSize: 18, color: "#2563EB" }}
                  />
                </Box>
                {statsLoading ? (
                  <Skeleton width="60%" height={36} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "#0F172A",
                    }}
                  >
                    {formatCurrency(paymentStats?.totalAccountA)}
                  </p>
                )}
              </Box>

              {/* Account B */}
              <Box
                sx={{
                  bgcolor: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Account B (Bank)
                  </p>
                  <AccountBalanceWalletOutlined
                    sx={{ fontSize: 18, color: "#7C3AED" }}
                  />
                </Box>
                {statsLoading ? (
                  <Skeleton width="60%" height={36} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "#0F172A",
                    }}
                  >
                    {formatCurrency(paymentStats?.totalAccountB)}
                  </p>
                )}
              </Box>

              {/* Cash Total */}
              <Box
                sx={{
                  bgcolor: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Cash Total
                  </p>
                  <AccountBalanceWalletOutlined
                    sx={{ fontSize: 18, color: "#059669" }}
                  />
                </Box>
                {statsLoading ? (
                  <Skeleton width="60%" height={36} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "#0F172A",
                    }}
                  >
                    {formatCurrency(paymentStats?.totalCash)}
                  </p>
                )}
              </Box>

              {/* Grand Total */}
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
                  borderRadius: "14px",
                  p: 2.5,
                  color: "white",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: 0.75,
                  }}
                >
                  Grand Total Collection
                </p>
                {statsLoading ? (
                  <Skeleton
                    width="70%"
                    height={42}
                    sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
                  />
                ) : (
                  <>
                    <p
                      style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800 }}
                    >
                      {formatCurrency(paymentStats?.grandTotal)}
                    </p>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1.5,
                        pt: 1.5,
                        borderTop: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <p
                        style={{ margin: 0, fontSize: "0.75rem", opacity: 0.8 }}
                      >
                        Total Verified
                      </p>
                      <Chip
                        label={`${paymentStats?.totalApproved || 0} verified`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.15)",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.68rem",
                          height: 22,
                        }}
                      />
                    </Box>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* ── Bottom Actions ── */}
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: "1px solid #E2E8F0",
            bgcolor: "#FAFBFC",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Button
            onClick={handleReject}
            disabled={rejecting || submitting}
            variant="outlined"
            color="error"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            {rejecting ? (
              <CircularProgress size={20} color="error" />
            ) : (
              "Reject Registration"
            )}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={submitting || rejecting}
            variant="contained"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 4,
              bgcolor: "#2563EB",
              "&:hover": { bgcolor: "#1D4ED8" },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Approve & Generate Receipt"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropOpen}
        imageSrc={cropSrc}
        onClose={() => {
          setCropOpen(false);
          setCropSrc(null);
        }}
        onComplete={handleCropComplete}
      />
    </>
  );
}
