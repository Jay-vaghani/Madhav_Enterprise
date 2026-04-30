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
  Tooltip,
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
  DoNotDisturbAltOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import {
  approveStudent,
  rejectStudent,
  fetchPaymentStats,
  fetchAllDepartments,
  fetchAllPickupPoints,
  fetchAllShifts,
} from "../../../api/admin/api";
import ImageCropModal from "../../../components/ImageCropModal";

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
    borderRadius: "12px",
    bgcolor: "#FFFFFF",
    fontSize: "0.88rem",
    transition: "all 0.2s ease-in-out",
    border: "1px solid #E2E8F0",
    "& fieldset": { border: "none" },
    "&:hover": {
      bgcolor: "#F8FAFC",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },
    "&.Mui-focused": {
      bgcolor: "#FFFFFF",
      boxShadow: "0 4px 12px rgba(37,99,235,0.08)",
      border: "1px solid #2563EB",
    },
  },
};

const labelSx = {
  margin: "0 0 6px 0",
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const sectionSx = {
  margin: "0 0 12px 0",
  fontSize: "0.75rem",
  fontWeight: 800,
  color: "#1E293B",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  display: "flex",
  alignItems: "center",
  gap: 1,
  "&::after": {
    content: '""',
    flex: 1,
    height: "1px",
    bgcolor: "#E2E8F0",
  },
};

const premiumCardSx = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "18px",
  p: 3,
  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
  },
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
  const [showStats, setShowStats] = useState(false);
  
  // Dynamic data from API
  const [departments, setDepartments] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [shifts, setShifts] = useState([]);
  const YEARS = [
    { value: "1", label: "First Year", autoSemester: "Semester 1-2", semesters: [{ value: "Semester 1-2", label: "Semester 1 - 2" }] },
    { value: "2", label: "Second Year", autoSemester: "Semester 3-4", semesters: [{ value: "Semester 3-4", label: "Semester 3 - 4" }] },
    { value: "3", label: "Third Year", autoSemester: "Semester 5-6", semesters: [{ value: "Semester 5-6", label: "Semester 5 - 6" }] },
    { value: "4", label: "Fourth Year", autoSemester: "Semester 7-8", semesters: [{ value: "Semester 7-8", label: "Semester 7 - 8" }] },
  ];

  // Fetch dynamic data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, pointRes, shiftRes] = await Promise.all([
          fetchAllDepartments(token),
          fetchAllPickupPoints(token),
          fetchAllShifts(token),
        ]);
        if (deptRes.success) setDepartments(deptRes.departments);
        if (pointRes.success) setPickupPoints(pointRes.pickupPoints);
        if (shiftRes.success) setShifts(shiftRes.shifts);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    if (open) loadData();
  }, [token, open]);

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
        departments.find((d) => d.id === student.department?.id) ||
        student.department ||
        null;
      const ppObj =
        pickupPoints.find((p) => p.id === student.pickupPoint?.id) ||
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

  // ── Reject Dialog State ──────────────────────────────────────
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const openRejectDialog = () => {
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  // ── Reject ──────────────────────────────────────────────────
  const handleReject = async () => {
    setRejecting(true);
    setError("");
    try {
      await rejectStudent(token, student._id, rejectReason);
      setRejectDialogOpen(false);
      onActionComplete?.("rejected");
    } catch (err) {
      setError(err.message || "Failed to reject student");
      setRejectDialogOpen(false);
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
                  background:
                    "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
                  borderRadius: "20px",
                  p: 4,
                  mb: 4,
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: "center",
                  gap: 4,
                  border: "1px solid #BAE6FD",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.3)",
                    filter: "blur(40px)",
                  },
                }}
              >
                <Box sx={{ position: "relative", zIndex: 1 }}>
                  {compressing ? (
                    <Box
                      sx={{
                        width: 160,
                        height: 160,
                        borderRadius: "20px",
                        bgcolor: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                      }}
                    >
                      <CircularProgress
                        size={32}
                        thickness={5}
                        sx={{ color: "#2563EB" }}
                      />
                    </Box>
                  ) : (
                    <Avatar
                      src={photoPreview}
                      alt={student.fullName}
                      sx={{
                        width: 160,
                        height: 160,
                        borderRadius: "20px",
                        border: "4px solid white",
                        boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.02)" },
                      }}
                      variant="rounded"
                    />
                  )}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -12,
                      right: -12,
                      display: "flex",
                      gap: 1,
                    }}
                  >
                    {photoPreview && (
                      <Tooltip title="Crop Image">
                        <IconButton
                          onClick={() => {
                            setCropSrc(photoPreview);
                            setCropOpen(true);
                          }}
                          sx={{
                            bgcolor: "#10B981",
                            color: "white",
                            width: 36,
                            height: 36,
                            boxShadow: "0 4px 12px rgba(16,185,129,0.4)",
                            "&:hover": {
                              bgcolor: "#059669",
                              transform: "translateY(-2px)",
                            },
                            transition: "all 0.2s",
                          }}
                        >
                          <CropOutlined sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Upload New Photo">
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          bgcolor: "#2563EB",
                          color: "white",
                          width: 36,
                          height: 36,
                          boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
                          "&:hover": {
                            bgcolor: "#1D4ED8",
                            transform: "translateY(-2px)",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        <CameraAltOutlined sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: { xs: "center", sm: "left" },
                    zIndex: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 0.5,
                      justifyContent: { xs: "center", sm: "flex-start" },
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 900,
                        fontSize: "2rem",
                        color: "#0F172A",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                      }}
                    >
                      {student.fullName}
                    </p>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                      mt: 1,
                      justifyContent: { xs: "center", sm: "flex-start" },
                    }}
                  >
                    <Chip
                      label={student.enrollmentNumber || "No Enrollment"}
                      size="small"
                      sx={{
                        bgcolor: "white",
                        fontWeight: 700,
                        color: "#475569",
                        border: "1px solid #E2E8F0",
                      }}
                    />
                    {newPhotoBase64 && (
                      <Chip
                        label="New photo selected"
                        size="small"
                        color="success"
                        sx={{
                          fontWeight: 700,
                          boxShadow: "0 2px 8px rgba(16,185,129,0.2)",
                        }}
                      />
                    )}
                  </Box>
                </Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoFileSelect}
                />
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
                            options={departments}
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
                            {shifts.map((shift) => {
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
                            options={pickupPoints}
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

              {/* ── Payment Authorization ── */}
              <Box sx={premiumCardSx}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: "#EFF6FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2563EB",
                    }}
                  >
                    <ReceiptLongOutlined sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        fontSize: "1rem",
                        color: "#0F172A",
                      }}
                    >
                      Payment Authorization
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "#64748B",
                      }}
                    >
                      Finalize the registration fee and collection
                    </p>
                  </Box>
                </Box>

                <Grid container spacing={3}>
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
                                fontSize: "0.8rem",
                                borderRadius: "10px",
                                height: 38,
                                px: 1,
                                ...(field.value === mode
                                  ? {
                                      bgcolor: "#2563EB",
                                      color: "white",
                                      borderColor: "#2563EB",
                                      boxShadow:
                                        "0 4px 12px rgba(37,99,235,0.25)",
                                    }
                                  : {
                                      borderColor: "#E2E8F0",
                                      color: "#64748B",
                                      bgcolor: "transparent",
                                    }),
                                transition: "all 0.2s",
                                "&:hover": {
                                  bgcolor:
                                    field.value === mode
                                      ? "#1D4ED8"
                                      : "#F8FAFC",
                                  borderColor:
                                    field.value === mode
                                      ? "#1D4ED8"
                                      : "#CBD5E1",
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
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    color:
                                      field.value === "A"
                                        ? "#2563EB"
                                        : "#475569",
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
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    color:
                                      field.value === "B"
                                        ? "#2563EB"
                                        : "#475569",
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
                            margin: "4px 0 0 4px",
                            fontSize: "0.75rem",
                            color: "#DC2626",
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
                          mb: 0.5,
                        }}
                      >
                        <p style={labelSx}>Transaction ID 1 *</p>
                        {!showTransaction2 && (
                          <IconButton
                            size="small"
                            onClick={() => setShowTransaction2(true)}
                            sx={{
                              bgcolor: "#F1F5F9",
                              color: "#64748B",
                              width: 24,
                              height: 24,
                              "&:hover": {
                                bgcolor: "#E2E8F0",
                                color: "#2563EB",
                              },
                            }}
                          >
                            <AddOutlined sx={{ fontSize: 16 }} />
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
                            mb: 0.5,
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
                              width: 24,
                              height: 24,
                              "&:hover": { bgcolor: "#FEE2E2" },
                            }}
                          >
                            <RemoveOutlined sx={{ fontSize: 16 }} />
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
                              inputProps={{
                                inputMode: "numeric",
                                maxLength: 12,
                              }}
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
                                  <Box
                                    sx={{ color: "#94A3B8", fontWeight: 700 }}
                                  >
                                    ₹
                                  </Box>
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
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val);
                                const fee = Number(watch("feeAmount")) || 0;
                                const cash = Number(val) || 0;
                                if (fee > 0) {
                                  setValue(
                                    "bankAmount",
                                    Math.max(0, fee - cash).toString(),
                                  );
                                }
                              }}
                              error={!!errors.cashAmount}
                              helperText={errors.cashAmount?.message}
                              slotProps={{
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Box
                                        sx={{
                                          color: "#94A3B8",
                                          fontWeight: 700,
                                        }}
                                      >
                                        ₹
                                      </Box>
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
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val);
                                const fee = Number(watch("feeAmount")) || 0;
                                const bank = Number(val) || 0;
                                if (fee > 0) {
                                  setValue(
                                    "cashAmount",
                                    Math.max(0, fee - bank).toString(),
                                  );
                                }
                              }}
                              error={!!errors.bankAmount}
                              helperText={errors.bankAmount?.message}
                              slotProps={{
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Box
                                        sx={{
                                          color: "#94A3B8",
                                          fontWeight: 700,
                                        }}
                                      >
                                        ₹
                                      </Box>
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
                      spacing={2}
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
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
                                  fontSize: "0.75rem",
                                  borderRadius: "8px",
                                  height: 32,
                                  cursor: "pointer",
                                  ...(isActive
                                    ? {
                                        bgcolor: "#2563EB",
                                        color: "white",
                                        boxShadow:
                                          "0 4px 10px rgba(37,99,235,0.2)",
                                      }
                                    : {
                                        bgcolor: "#F1F5F9",
                                        color: "#475569",
                                        border: "1px solid #E2E8F0",
                                      }),
                                  transition: "all 0.2s",
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
                p: { xs: 3, sm: 4 },
                bgcolor: "#F8FAFC",
                display: "flex",
                flexDirection: "column",
                gap: 3,
                borderLeft: { md: "1px solid #E2E8F0" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  pb: 1,
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      bgcolor: "#2563EB",
                      borderRadius: 1,
                    }}
                  />
                  <p
                    style={{
                      ...sectionSx,
                      margin: 0,
                      border: "none",
                      flex: "none",
                    }}
                  >
                    Collection Insights
                  </p>
                </Box>

                <Tooltip title="Hold to view sensitive stats">
                  <IconButton
                    onMouseDown={() => setShowStats(true)}
                    onMouseUp={() => setShowStats(false)}
                    onMouseLeave={() => setShowStats(false)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setShowStats(true);
                    }}
                    onTouchEnd={() => setShowStats(false)}
                    size="small"
                    sx={{
                      bgcolor: showStats ? "#2563EB" : "#F1F5F9",
                      color: showStats ? "white" : "#64748B",
                      "&:hover": { bgcolor: showStats ? "#1D4ED8" : "#E2E8F0" },
                      transition: "all 0.2s",
                      boxShadow: showStats
                        ? "0 4px 10px rgba(37,99,235,0.3)"
                        : "none",
                    }}
                  >
                    {showStats ? (
                      <VisibilityOutlined sx={{ fontSize: 18 }} />
                    ) : (
                      <VisibilityOffOutlined sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Account A */}
              <Box
                sx={{
                  bgcolor: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: "20px",
                  p: 3,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.04)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      bgcolor: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AccountBalanceOutlined sx={{ fontSize: 22 }} />
                  </Box>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Account A
                  </p>
                </Box>
                {statsLoading ? (
                  <Skeleton width="80%" height={40} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.75rem",
                      fontWeight: 900,
                      color: "#0F172A",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {showStats
                      ? formatCurrency(paymentStats?.totalAccountA)
                      : "₹ — — — —"}
                  </p>
                )}
              </Box>

              {/* Account B */}
              <Box
                sx={{
                  bgcolor: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: "20px",
                  p: 3,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.04)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      bgcolor: "#F5F3FF",
                      color: "#7C3AED",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AccountBalanceWalletOutlined sx={{ fontSize: 22 }} />
                  </Box>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Account B
                  </p>
                </Box>
                {statsLoading ? (
                  <Skeleton width="80%" height={40} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.75rem",
                      fontWeight: 900,
                      color: "#0F172A",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {showStats
                      ? formatCurrency(paymentStats?.totalAccountB)
                      : "₹ — — — —"}
                  </p>
                )}
              </Box>

              {/* Cash Total */}
              <Box
                sx={{
                  bgcolor: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: "20px",
                  p: 3,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.04)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      bgcolor: "#ECFDF5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AccountBalanceWalletOutlined sx={{ fontSize: 22 }} />
                  </Box>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Cash Total
                  </p>
                </Box>
                {statsLoading ? (
                  <Skeleton width="80%" height={40} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.75rem",
                      fontWeight: 900,
                      color: "#0F172A",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {showStats
                      ? formatCurrency(paymentStats?.totalCash)
                      : "₹ — — — —"}
                  </p>
                )}
              </Box>

              {/* Grand Total */}
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
                  borderRadius: "24px",
                  p: 3.5,
                  color: "white",
                  boxShadow: "0 15px 35px rgba(37,99,235,0.25)",
                  position: "relative",
                  overflow: "hidden",
                  "&::after": {
                    content: '""',
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    opacity: 0.8,
                  }}
                >
                  Grand Total Revenue
                </p>
                {statsLoading ? (
                  <Skeleton
                    width="70%"
                    height={48}
                    sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                  />
                ) : (
                  <>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "2.2rem",
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {showStats
                        ? formatCurrency(paymentStats?.grandTotal)
                        : "₹ — — — —"}
                    </p>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 2.5,
                        pt: 2,
                        borderTop: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <Box>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.65rem",
                            opacity: 0.7,
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}
                        >
                          Students
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "1rem",
                            fontWeight: 800,
                          }}
                        >
                          {paymentStats?.totalApproved || 0}
                        </p>
                      </Box>
                      <Chip
                        label="Live Stats"
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                          fontWeight: 800,
                          fontSize: "0.65rem",
                          height: 24,
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.1)",
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
            onClick={openRejectDialog}
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
              "Reject"
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
              "Approve"
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

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 1,
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", pt: 4, pb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#FEF2F2",
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <DoNotDisturbAltOutlined sx={{ fontSize: 32 }} />
          </Box>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "#0F172A",
            }}
          >
            Reject Registration
          </h2>
          <p
            style={{ margin: "0 0 24px", fontSize: "0.9rem", color: "#64748B" }}
          >
            Are you sure you want to reject <strong>{student?.fullName}</strong>
            's registration? This will move them to the rejected archive.
          </p>

          <Box sx={{ textAlign: "left" }}>
            <p style={labelSx}>Rejection Reason (Optional)</p>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="E.g., Invalid document, duplicate entry..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              sx={fieldSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, justifyContent: "center", gap: 1 }}>
          <Button
            onClick={() => setRejectDialogOpen(false)}
            variant="outlined"
            disabled={rejecting}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              borderColor: "#E2E8F0",
              color: "#64748B",
              "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={rejecting}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              minWidth: 120,
            }}
          >
            {rejecting ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Confirm Reject"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
