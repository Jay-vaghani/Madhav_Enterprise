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
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  CameraAltOutlined,
  AccountBalanceOutlined,
  AccountBalanceWalletOutlined,
  CloseOutlined,
  SaveOutlined,
  CropOutlined,
  AddOutlined,
  RemoveOutlined,
  EditOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import {
  updateApprovedStudent,
  fetchPaymentStats,
  fetchAllDepartments,
  fetchAllPickupPoints,
  fetchAllShifts,
} from "../../../api/admin/api";
import ImageCropModal from "../../../components/ImageCropModal";

// ── Compress base64 image to WEBP ≤ 50 KB ─────────────────────
async function compressToWebpUnder50KB(base64Input, maxKB = 50) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
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
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
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

const VALIDITY_DATES = [
  "30/04/2026",
  "30/06/2026",
  "31/07/2026",
  "31/08/2026",
  "30/09/2026",
  "31/10/2026",
  "31/12/2026",
];
const toInputDate = (ddmmyyyy) => {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}-${m}-${d}`;
};
const toInputDateFromISO = (iso) => {
  if (!iso) return "";
  const dt = new Date(iso);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const formatCurrency = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

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
export default function EditApprovedStudentModal({
  open,
  student, // approved student object (enriched with payment)
  onClose,
  onSaved, // callback(updatedStudent) after successful save
}) {
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPhotoBase64, setNewPhotoBase64] = useState(null);
  const [compressing, setCompressing] = useState(false);

  const [cropSrc, setCropSrc] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);

  const [paymentStats, setPaymentStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  // Auto-set semester when year changes (only if user just changed it)
  const [yearChanged, setYearChanged] = useState(false);
  useEffect(() => {
    if (yearChanged && watchedYear) {
      const yearData = YEARS.find((y) => y.value === watchedYear);
      if (yearData) setValue("semester", yearData.autoSemester);
      setYearChanged(false);
    }
  }, [watchedYear, yearChanged, setValue]);

  // Auto-set shift when department changes (only if user just changed it)
  const [deptChanged, setDeptChanged] = useState(false);
  useEffect(() => {
    if (deptChanged && watchedDepartment?.defaultShift) {
      setValue("shift", watchedDepartment.defaultShift);
      setDeptChanged(false);
    }
  }, [watchedDepartment, deptChanged, setValue]);

  // Auto-set fee when pickup point changes (only if user just changed it)
  const [ppChanged, setPpChanged] = useState(false);
  useEffect(() => {
    if (ppChanged && watchedPickupPoint?.fee) {
      setValue("feeAmount", watchedPickupPoint.fee);
      setPpChanged(false);
    }
  }, [watchedPickupPoint, ppChanged, setValue]);

  // Pre-fill form when a student is selected
  useEffect(() => {
    if (!student) return;

    const deptObj =
      departments.find((d) => d.id === student.department?.id) ||
      student.department ||
      null;
    const ppObj =
      pickupPoints.find((p) => p.id === student.pickupPoint?.id) ||
      student.pickupPoint ||
      null;
    const pmt = student.payment;

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
      paymentMode: pmt?.paymentMethod || "cash",
      settlementAccount: pmt?.settlementAccount || "A",
      transaction1: pmt?.transaction1 || "",
      transaction2: pmt?.transaction2 || "",
      feeAmount: pmt?.amount ?? ppObj?.fee ?? "",
      cashAmount: pmt?.cashAmount || "",
      bankAmount: pmt?.bankAmount || "",
      validityDate: toInputDateFromISO(student.validityDate),
      remarks: student.remarks || "",
    });

    setPhotoPreview(student.photoUrl || null);
    setNewPhotoBase64(null);
    setShowTransaction2(!!pmt?.transaction2);
    setError("");
    // Don't trigger auto-setters
    setYearChanged(false);
    setDeptChanged(false);
    setPpChanged(false);
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

  // Photo select → open crop
  const handlePhotoFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null;
    setCropSrc(URL.createObjectURL(file));
    setCropOpen(true);
  }, []);

  // After crop → compress → preview
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

  // Submit
  const onSubmit = async (data) => {
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

      const res = await updateApprovedStudent(token, student._id, payload);
      onSaved?.(res.data);
    } catch (err) {
      setError(err.message || "Failed to update student");
    } finally {
      setSubmitting(false);
    }
  };

  if (!student) return null;

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
              borderRadius: { xs: 0, sm: "24px" },
              maxHeight: { xs: "100vh", sm: "94vh" },
              margin: { xs: 0, sm: undefined },
              width: { xs: "100%", sm: undefined },
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            },
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, sm: 4 },
            py: 2.5,
            borderBottom: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            position: "relative",
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                bgcolor: "#FFF7ED",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(234,88,12,0.1)",
              }}
            >
              <EditOutlined sx={{ fontSize: 22, color: "#EA580C" }} />
            </Box>
            <Box>
              <p
                style={{
                  margin: 0,
                  fontWeight: 900,
                  fontSize: "1.1rem",
                  color: "#0F172A",
                  letterSpacing: "-0.01em",
                }}
              >
                Edit Student Record
              </p>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={`Receipt #${student.receiptNumber}`}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: "#F1F5F9",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    borderRadius: "6px",
                  }}
                />
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B" }}>
                  {student.fullName}
                </p>
              </Box>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              bgcolor: "#F8FAFC",
              borderRadius: "12px",
              "&:hover": { bgcolor: "#F1F5F9", transform: "rotate(90deg)" },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <CloseOutlined sx={{ fontSize: 20, color: "#64748B" }} />
          </IconButton>
        </Box>

        {/* ── Body ── */}
        <DialogContent sx={{ p: 0, overflow: "auto", bgcolor: "#FFFFFF" }}>
          <Grid container>
            {/* ════════════ LEFT COLUMN — Form ════════════ */}
            <Grid
              size={{ xs: 12, md: 8 }}
              sx={{
                p: { xs: 2, sm: 4 },
                borderRight: { md: "1px solid #E2E8F0" },
                bgcolor: "#FFFFFF",
              }}
            >
              {/* ── Identity Card ── */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  mb: 5,
                  alignItems: "center",
                  p: 3,
                  bgcolor: "#F8FAFC",
                  borderRadius: "24px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Box sx={{ position: "relative" }}>
                  {compressing ? (
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "white",
                        borderRadius: "20px",
                        border: "1px dashed #CBD5E1",
                      }}
                    >
                      <CircularProgress size={28} thickness={5} />
                    </Box>
                  ) : (
                    <Avatar
                      src={photoPreview}
                      alt={student.fullName}
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: "20px",
                        border: "3px solid white",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                      }}
                      variant="rounded"
                    />
                  )}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -8,
                      right: -8,
                      display: "flex",
                      gap: 0.5,
                    }}
                  >
                    <Tooltip title="Take Photo">
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        size="small"
                        sx={{
                          bgcolor: "#2563EB",
                          color: "white",
                          "&:hover": { bgcolor: "#1D4ED8" },
                          boxShadow: "0 4px 10px rgba(37,99,235,0.3)",
                        }}
                      >
                        <CameraAltOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    {photoPreview && (
                      <Tooltip title="Crop Image">
                        <IconButton
                          onClick={() => {
                            setCropSrc(photoPreview);
                            setCropOpen(true);
                          }}
                          size="small"
                          sx={{
                            bgcolor: "#10B981",
                            color: "white",
                            "&:hover": { bgcolor: "#059669" },
                            boxShadow: "0 4px 10px rgba(16,185,129,0.3)",
                          }}
                        >
                          <CropOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoFileSelect}
                  />
                </Box>
                <Box>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 900,
                      fontSize: "1.5rem",
                      color: "#0F172A",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {student.fullName}
                  </p>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mt: 1,
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      label={student.enrollmentNumber || "No Enrollment"}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 24,
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        borderColor: "#E2E8F0",
                        color: "#64748B",
                      }}
                    />
                    {newPhotoBase64 && (
                      <Chip
                        label="New photo pending"
                        size="small"
                        color="success"
                        sx={{ height: 24, fontWeight: 700, fontSize: "0.7rem" }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* ── Student Identification ── */}
              <p style={sectionSx}>Student Identification</p>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <p style={labelSx}>Full Name</p>
                  <Controller
                    name="fullName"
                    control={control}
                    rules={{ required: "Required" }}
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
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* ── Academic Profile ── */}
              <p style={sectionSx}>Academic Profile</p>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <p style={labelSx}>Year</p>
                  <Controller
                    name="year"
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        size="small"
                        fullWidth
                        error={!!errors.year}
                        helperText={errors.year?.message}
                        sx={fieldSx}
                        onChange={(e) => {
                          field.onChange(e);
                          setYearChanged(true);
                        }}
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
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <Autocomplete
                        options={departments}
                        value={field.value}
                        getOptionLabel={(o) => o?.label ?? ""}
                        isOptionEqualToValue={(o, v) => o?.id === v?.id}
                        onChange={(_, selected) => {
                          field.onChange(selected);
                          setDeptChanged(true);
                        }}
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

              {/* ── Transport Logistics ── */}
              <p style={sectionSx}>Transport Logistics</p>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={12}>
                  <p style={labelSx}>Academic Shift</p>
                  <Controller
                    name="shift"
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                        {shifts.map((s) => {
                          const isSelected = field.value === s.id;
                          return (
                            <Box
                              key={s.id}
                              onClick={() => field.onChange(s.id)}
                              sx={{
                                border: "1.5px solid",
                                borderColor: isSelected ? "#2563EB" : "#E2E8F0",
                                borderRadius: "14px",
                                p: 2,
                                display: "flex",
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer",
                                bgcolor: isSelected ? "#EFF6FF" : "#FFFFFF",
                                transition:
                                  "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                "&:hover": {
                                  borderColor: "#2563EB",
                                  bgcolor: "#F8FAFF",
                                  transform: "translateY(-2px)",
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <span style={{ fontSize: "1.2rem" }}>
                                  {s.emoji}
                                </span>
                                <div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontWeight: 800,
                                      fontSize: "0.85rem",
                                      color: "#0F172A",
                                    }}
                                  >
                                    {s.label}
                                  </p>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "0.7rem",
                                      color: "#64748B",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {s.time}
                                  </p>
                                </div>
                              </Box>
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: "50%",
                                  border: "2px solid",
                                  borderColor: isSelected
                                    ? "#2563EB"
                                    : "#CBD5E1",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.2s",
                                }}
                              >
                                {isSelected && (
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: "50%",
                                      bgcolor: "#2563EB",
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
                <Grid size={12}>
                  <p style={labelSx}>Pickup Point</p>
                  <Controller
                    name="pickupPoint"
                    control={control}
                    rules={{ required: "Required" }}
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
                        onChange={(_, selected) => {
                          field.onChange(selected);
                          setPpChanged(true);
                        }}
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

              {/* ── Communication ── */}
              <p style={sectionSx}>Communication & Residential</p>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <p style={labelSx}>Student Phone</p>
                  <Controller
                    name="mobile"
                    control={control}
                    rules={{ required: "Required" }}
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <p style={labelSx}>Parent / Guardian Phone</p>
                  <Controller
                    name="guardianMobile"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        type="tel"
                        inputProps={{ inputMode: "tel" }}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={12}>
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
                        placeholder="example@email.com"
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
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        inputProps={{ inputMode: "numeric", maxLength: 6 }}
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
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        placeholder="Street, City, State"
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* ── Payment Section ── */}
              <Box
                sx={{
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "24px",
                  p: 3.5,
                  mt: 2,
                }}
              >
                <p
                  style={{
                    ...sectionSx,
                    color: "#2563EB",
                    "&::after": { bgcolor: "#DBEAFE" },
                    marginBottom: "24px",
                  }}
                >
                  Payment Information
                </p>
                <Grid container spacing={3}>
                  {/* Payment Mode */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <p style={{ ...labelSx, margin: 0 }}>Payment Mode</p>
                    </Box>
                    <Controller
                      name="paymentMode"
                      control={control}
                      render={({ field }) => (
                        <Box
                          sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}
                        >
                          {["cash", "bank", "both"].map((mode) => (
                            <Chip
                              key={mode}
                              label={
                                mode === "bank"
                                  ? "Bank Transfer"
                                  : mode.charAt(0).toUpperCase() + mode.slice(1)
                              }
                              onClick={() => field.onChange(mode)}
                              variant={
                                field.value === mode ? "filled" : "outlined"
                              }
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                borderRadius: "12px",
                                height: 36,
                                flex: 1,
                                px: 1,
                                ...(field.value === mode
                                  ? {
                                      bgcolor: "#2563EB",
                                      color: "white",
                                      borderColor: "#2563EB",
                                      boxShadow:
                                        "0 4px 10px rgba(37,99,235,0.2)",
                                    }
                                  : {
                                      borderColor: "#E2E8F0",
                                      color: "#64748B",
                                      bgcolor: "white",
                                    }),
                                transition: "all 0.2s",
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

                  {/* Settlement Account */}
                  {watchedPaymentMode !== "cash" && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box
                        sx={{
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          mb: 0.5,
                        }}
                      >
                        <p style={{ ...labelSx, margin: 0 }}>
                          Settlement Account
                        </p>
                      </Box>
                      <Controller
                        name="settlementAccount"
                        control={control}
                        render={({ field }) => (
                          <RadioGroup
                            row
                            {...field}
                            sx={{ height: 36, alignItems: "center" }}
                          >
                            <FormControlLabel
                              value="A"
                              control={<Radio size="small" />}
                              label={
                                <span
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  Account A
                                </span>
                              }
                              sx={{ mr: 2 }}
                            />
                            <FormControlLabel
                              value="B"
                              control={<Radio size="small" />}
                              label={
                                <span
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  Account B
                                </span>
                              }
                            />
                          </RadioGroup>
                        )}
                      />
                    </Grid>
                  )}

                  {/* Transaction 1 */}
                  {(watchedPaymentMode === "bank" ||
                    watchedPaymentMode === "both") && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          height: 32,
                          mb: 0.5,
                        }}
                      >
                        <p style={{ ...labelSx, margin: 0 }}>
                          Transaction ID 1
                        </p>
                        {!showTransaction2 && (
                          <Button
                            startIcon={<AddOutlined />}
                            size="small"
                            onClick={() => setShowTransaction2(true)}
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              textTransform: "none",
                              color: "#2563EB",
                              py: 0,
                            }}
                          >
                            Add Second ID
                          </Button>
                        )}
                      </Box>
                      <Controller
                        name="transaction1"
                        control={control}
                        rules={{
                          required:
                            watchedPaymentMode === "bank" ||
                            watchedPaymentMode === "both"
                              ? "Required"
                              : false,
                          pattern: {
                            value: /^[0-9]{12}$/,
                            message: "Must be 12 digits",
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            size="small"
                            fullWidth
                            placeholder="UTR / Ref Number"
                            inputProps={{ inputMode: "numeric", maxLength: 12 }}
                            error={!!errors.transaction1}
                            helperText={errors.transaction1?.message}
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
                    <Box
                      sx={{
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <p style={{ ...labelSx, margin: 0 }}>Fee Amount (₹)</p>
                    </Box>
                    <Controller
                      name="feeAmount"
                      control={control}
                      rules={{ required: "Required" }}
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

                  {/* Transaction 2 */}
                  {showTransaction2 &&
                    (watchedPaymentMode === "bank" ||
                      watchedPaymentMode === "both") && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            height: 32,
                            mb: 0.5,
                          }}
                        >
                          <p style={{ ...labelSx, margin: 0 }}>
                            Transaction ID 2
                          </p>
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
                              message: "Must be 12 digits",
                            },
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              fullWidth
                              placeholder="Second transaction ID"
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

                  {/* Cash + Bank split */}
                  {watchedPaymentMode === "both" && (
                    <>
                      <Grid size={{ xs: 6 }}>
                        <Box
                          sx={{
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <p style={{ ...labelSx, margin: 0 }}>
                            Cash Amount (₹)
                          </p>
                        </Box>
                        <Controller
                          name="cashAmount"
                          control={control}
                          rules={{ required: "Required" }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              fullWidth
                              type="tel"
                              inputProps={{ inputMode: "numeric" }}
                              error={!!errors.cashAmount}
                              helperText={errors.cashAmount?.message}
                              sx={fieldSx}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box
                          sx={{
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <p style={{ ...labelSx, margin: 0 }}>
                            Bank Amount (₹)
                          </p>
                        </Box>
                        <Controller
                          name="bankAmount"
                          control={control}
                          rules={{ required: "Required" }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              fullWidth
                              type="tel"
                              inputProps={{ inputMode: "numeric" }}
                              error={!!errors.bankAmount}
                              helperText={errors.bankAmount?.message}
                              sx={fieldSx}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Validity Date */}
                  <Grid size={12}>
                    <Box
                      sx={{
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <p style={{ ...labelSx, margin: 0 }}>
                        Validity Expiration
                      </p>
                    </Box>
                    <Grid
                      container
                      spacing={2}
                      sx={{ alignItems: "flex-start" }}
                    >
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Controller
                          name="validityDate"
                          control={control}
                          rules={{ required: "Required" }}
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
                                  fontWeight: 800,
                                  fontSize: "0.65rem",
                                  borderRadius: "8px",
                                  height: 32,
                                  cursor: "pointer",
                                  px: 0.5,
                                  ...(isActive
                                    ? {
                                        bgcolor: "#2563EB",
                                        color: "white",
                                        boxShadow:
                                          "0 4px 12px rgba(37,99,235,0.2)",
                                      }
                                    : {
                                        bgcolor: "white",
                                        color: "#64748B",
                                        border: "1px solid #E2E8F0",
                                      }),
                                  "&:hover": {
                                    bgcolor: isActive ? "#1D4ED8" : "#F1F5F9",
                                  },
                                  transition: "all 0.2s",
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
                    <Box
                      sx={{
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <p style={{ ...labelSx, margin: 0 }}>Internal Remarks</p>
                    </Box>
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
                          placeholder="Add notes for this student record..."
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 3, borderRadius: "14px" }}>
                  {error}
                </Alert>
              )}
            </Grid>

            {/* ════════════ RIGHT COLUMN — Collection Insights ════════════ */}
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                p: { xs: 2, sm: 4 },
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
              <Box sx={premiumCardSx}>
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
              <Box sx={premiumCardSx}>
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

              {/* Cash */}
              <Box sx={premiumCardSx}>
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

              {/* Grand Total Revenue */}
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
                )}
                <Box
                  sx={{
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
                      Official Receipt Number
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "1.1rem",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        letterSpacing: "0.05em",
                      }}
                    >
                      #{student.receiptNumber}
                    </p>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* ── Footer Actions ── */}
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: "1px solid #E2E8F0",
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Button
            onClick={onClose}
            disabled={submitting}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              color: "#64748B",
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={submitting}
            variant="contained"
            startIcon={
              submitting ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <SaveOutlined />
              )
            }
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#EA580C",
              "&:hover": { bgcolor: "#C2410C" },
              px: 3,
              minWidth: 130,
            }}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Crop modal */}
      {cropOpen && (
        <ImageCropModal
          open={cropOpen}
          imageSrc={cropSrc}
          onComplete={handleCropComplete}
          onClose={() => {
            setCropOpen(false);
            setCropSrc(null);
          }}
        />
      )}
    </>
  );
}
