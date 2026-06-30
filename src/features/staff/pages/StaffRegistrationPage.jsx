import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogContent,
  Chip,
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchStaffPickupPoints, registerStaff } from "../../../api/admin/api";
import {
  SchoolOutlined,
  PersonOutlined,
  HomeOutlined,
  PhoneOutlined,
  DirectionsBusOutlined,
  AccessTimeOutlined,
  CheckCircleOutlined,
  LocationOnOutlined,
  InfoOutlined,
  ArrowForwardOutlined,
} from "@mui/icons-material";

const SCHOOL_OPTIONS = [
  "KPGU Staff",
  "KSET",
  "KSDS",
  "KST",
  "KSS",
  "KSN",
  "KSP",
  "KSPR",
  "KAMC",
  "KSC",
  "KSBM",
  "KSAH",
];

export default function StaffRegistrationPage() {
  const navigate = useNavigate();

  const [pickupPoints, setPickupPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    schoolOrCollege: "",
    shift: "",
    residentialAddress: "",
    mobile: "",
    pickupPoint: null,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadPoints = async () => {
      try {
        const res = await fetchStaffPickupPoints();
        if (res.success) {
          setPickupPoints(res.data);
        }
      } catch (err) {
        console.error("Failed to load pickup points", err);
      } finally {
        setLoadingPoints(false);
      }
    };
    loadPoints();
  }, []);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError("");
  };

  const validate = () => {
    const errs = {};
    if (!formData.name) errs.name = "Full name is required.";
    if (!formData.schoolOrCollege)
      errs.schoolOrCollege = "School / College is required.";
    if (!formData.residentialAddress)
      errs.residentialAddress = "Residential address is required.";
    if (!formData.mobile || formData.mobile.length !== 10)
      errs.mobile = "Valid 10-digit mobile number is required.";
    if (!formData.shift) errs.shift = "Please select a shift time.";
    if (!formData.pickupPoint) errs.pickupPoint = "Pickup point is required.";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setServerError("");

    try {
      const payload = {
        name: formData.name,
        schoolOrCollege: formData.schoolOrCollege,
        shift: formData.shift,
        residentialAddress: formData.residentialAddress,
        mobile: formData.mobile,
        pickupPoint: formData.pickupPoint._id || formData.pickupPoint.id,
      };

      await registerStaff(payload);
      setShowSuccess(true);
    } catch (err) {
      setServerError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: "#F8FAFC",
      "&:hover fieldset": { borderColor: "#2563EB" },
      "&.Mui-focused fieldset": { borderColor: "#2563EB", borderWidth: "2px" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "#2563EB" },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 50%, #F8FAFC 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        fontFamily: '"Inter", "Roboto", sans-serif',
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 560 }}>
        {/* Header Card */}
        <Box
          sx={{
            textAlign: "center",
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "18px",
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              boxShadow: "0 8px 24px rgba(37, 99, 235, 0.3)",
            }}
          >
            <SchoolOutlined sx={{ color: "#fff", fontSize: 32 }} />
          </Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}
          >
            Faculty &amp; Staff
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.2,
            }}
          >
            Registration
          </Typography>
          <Typography sx={{ color: "#64748B", mt: 1, fontSize: "0.9rem" }}>
            Register for the college bus transport service
          </Typography>
        </Box>

        {/* Form Card */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: "24px",
            p: { xs: 3, sm: 4 },
            boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
            border: "1px solid #E2E8F0",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Section: Personal Info */}
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#94A3B8",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Personal Information
            </Typography>

            <TextField
              label="Full Name"
              fullWidth
              value={formData.name}
              onChange={handleChange("name")}
              size="small"
              placeholder="Dr. / Mr. / Mrs. Your Name"
              error={!!fieldErrors.name}
              helperText={fieldErrors.name || ""}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlined sx={{ fontSize: 18, color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {/* School / College — Autocomplete */}
            <Autocomplete
              options={SCHOOL_OPTIONS}
              value={formData.schoolOrCollege || null}
              onChange={(_, val) => {
                setFormData((prev) => ({
                  ...prev,
                  schoolOrCollege: val || "",
                }));
                setFieldErrors((prev) => ({ ...prev, schoolOrCollege: "" }));
                setServerError("");
              }}
              freeSolo
              onInputChange={(_, val) => {
                setFormData((prev) => ({
                  ...prev,
                  schoolOrCollege: val || "",
                }));
                setFieldErrors((prev) => ({ ...prev, schoolOrCollege: "" }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="School / College"
                  size="small"
                  placeholder="Select or type your institution"
                  error={!!fieldErrors.schoolOrCollege}
                  helperText={fieldErrors.schoolOrCollege || ""}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SchoolOutlined
                            sx={{ fontSize: 18, color: "#94A3B8" }}
                          />
                        </InputAdornment>
                        {params.InputProps?.startAdornment}
                      </>
                    ),
                  }}
                  sx={inputSx}
                />
              )}
            />

            <TextField
              label="Residential Address"
              fullWidth
              multiline
              rows={2}
              value={formData.residentialAddress}
              onChange={handleChange("residentialAddress")}
              size="small"
              placeholder="Your home / residential address"
              error={!!fieldErrors.residentialAddress}
              helperText={fieldErrors.residentialAddress || ""}
              InputProps={{
                startAdornment: (
                  <InputAdornment
                    position="start"
                    sx={{ alignSelf: "flex-start", mt: "9px" }}
                  >
                    <HomeOutlined sx={{ fontSize: 18, color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            <TextField
              label="Mobile Number"
              type="tel"
              fullWidth
              value={formData.mobile}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setFormData((prev) => ({ ...prev, mobile: val }));
                setFieldErrors((prev) => ({ ...prev, mobile: "" }));
                setServerError("");
              }}
              size="small"
              placeholder="10-digit mobile number"
              error={!!fieldErrors.mobile}
              helperText={fieldErrors.mobile || ""}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlined sx={{ fontSize: 18, color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {/* Section: Service Details */}
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#94A3B8",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                mt: 0.5,
              }}
            >
              Service Details
            </Typography>

            {/* Shift */}
            <Box>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                {[
                  { value: "07:30", label: "07:30 AM" },
                  { value: "09:30", label: "09:30 AM" },
                ].map((opt) => (
                  <Box
                    key={opt.value}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, shift: opt.value }));
                      setFieldErrors((prev) => ({ ...prev, shift: "" }));
                      setServerError("");
                    }}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      px: 2,
                      borderRadius: "12px",
                      border: fieldErrors.shift
                        ? "1.5px solid #EF4444"
                        : formData.shift === opt.value
                          ? "2px solid #2563EB"
                          : "1.5px solid #E2E8F0",
                      bgcolor:
                        formData.shift === opt.value ? "#EFF6FF" : "#F8FAFC",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      "&:hover": { borderColor: "#2563EB", bgcolor: "#F0F7FF" },
                    }}
                  >
                    <AccessTimeOutlined
                      sx={{
                        fontSize: 18,
                        color:
                          formData.shift === opt.value ? "#2563EB" : "#94A3B8",
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        fontWeight: formData.shift === opt.value ? 700 : 500,
                        color:
                          formData.shift === opt.value ? "#2563EB" : "#475569",
                      }}
                    >
                      {opt.label}
                    </Typography>
                    {formData.shift === opt.value && (
                      <Box sx={{ ml: "auto" }}>
                        <CheckCircleOutlined
                          sx={{ fontSize: 16, color: "#2563EB" }}
                        />
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
              {fieldErrors.shift && (
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "#EF4444",
                    mt: 0.5,
                    ml: 1.5,
                  }}
                >
                  {fieldErrors.shift}
                </Typography>
              )}
            </Box>

            {/* Pickup Point */}
            <Autocomplete
              options={pickupPoints}
              getOptionLabel={(option) => option.label || ""}
              value={formData.pickupPoint}
              onChange={(_, val) => {
                setFormData((prev) => ({ ...prev, pickupPoint: val }));
                setFieldErrors((prev) => ({ ...prev, pickupPoint: "" }));
                setServerError("");
              }}
              loading={loadingPoints}
              isOptionEqualToValue={(opt, val) => opt._id === val?._id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pickup Point"
                  size="small"
                  placeholder="Select your boarding stop"
                  error={!!fieldErrors.pickupPoint}
                  helperText={fieldErrors.pickupPoint || ""}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <LocationOnOutlined
                            sx={{ fontSize: 18, color: "#94A3B8" }}
                          />
                        </InputAdornment>
                        {params.InputProps?.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <React.Fragment>
                        {loadingPoints ? (
                          <CircularProgress color="inherit" size={18} />
                        ) : null}
                        {params.InputProps?.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                  sx={inputSx}
                />
              )}
            />

            {/* Fee Info Card */}
            {formData.pickupPoint && (
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "linear-gradient(135deg, #EFF6FF, #F0FDFB)",
                  background:
                    "linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)",
                  borderRadius: "14px",
                  border: "1.5px solid #BFDBFE",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DirectionsBusOutlined
                      sx={{ fontSize: 18, color: "#2563EB" }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        color: "#64748B",
                        fontWeight: 600,
                      }}
                    >
                      {formData.pickupPoint.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={`₹${formData.pickupPoint.fee} / month`}
                    size="small"
                    sx={{
                      bgcolor: "#2563EB",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      height: 26,
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    bgcolor: "rgba(37, 99, 235, 0.06)",
                    borderRadius: "10px",
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.8,
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                  >
                    <InfoOutlined
                      sx={{
                        fontSize: 14,
                        color: "#2563EB",
                        flexShrink: 0,
                        mt: "2px",
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.78rem",
                        color: "#1E40AF",
                        lineHeight: 1.5,
                      }}
                    >
                      <strong>Payment is collected the following month.</strong>{" "}
                      For example, your May fees will be collected in June.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Submit */}
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                py: 1.6,
                mt: 1,
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(37, 99, 235, 0.35)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1D4ED8, #1E40AF)",
                  boxShadow: "0 6px 20px rgba(37, 99, 235, 0.45)",
                },
                "&:disabled": { opacity: 0.7 },
              }}
              endIcon={!submitting && <ArrowForwardOutlined />}
            >
              {submitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={18} color="inherit" />
                  Registering...
                </Box>
              ) : (
                "Submit Registration"
              )}
            </Button>

            {serverError && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.5,
                  bgcolor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "10px",
                }}
              >
                <InfoOutlined
                  sx={{ color: "#EF4444", fontSize: 16, flexShrink: 0 }}
                />
                <Typography sx={{ color: "#EF4444", fontSize: "0.82rem" }}>
                  {serverError}
                </Typography>
              </Box>
            )}

            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontSize: "0.85rem", color: "#94A3B8" }}>
                Already registered?{" "}
                <span
                  style={{
                    color: "#2563EB",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() => navigate("/staff/payment")}
                >
                  Upload Payment
                </span>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Success Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={showSuccess}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            p: 0,
            overflow: "hidden",
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Top gradient band */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              p: 4,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <CheckCircleOutlined sx={{ fontSize: 40, color: "#fff" }} />
            </Box>
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.3rem",
                mb: 0.5,
              }}
            >
              Registration Successful!
            </Typography>
            <Typography
              sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem" }}
            >
              Your application has been submitted
            </Typography>
          </Box>

          {/* Body */}
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                bgcolor: "#FFF7ED",
                border: "1.5px solid #FED7AA",
                borderRadius: "14px",
                p: 2.5,
                mb: 2.5,
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "8px",
                    bgcolor: "#F97316",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <LocationOnOutlined sx={{ fontSize: 16, color: "#fff" }} />
                </Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#9A3412",
                    fontSize: "0.95rem",
                  }}
                >
                  Next Step — Visit Transport Office
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: "#C2410C",
                  fontSize: "0.83rem",
                  lineHeight: 1.7,
                  pl: "38px",
                }}
              >
                Please visit the <strong>Transport Office</strong> to get your
                service <strong>activated</strong>. Your account is registered
                but the bus service will only start after admin activation.
              </Typography>
            </Box>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}
            >
              {[
                "Your account is created & pending activation",
                "Visit the transport office with your ID",
                "Admin will activate your service",
                "Payment starts from the month after activation",
              ].map((step, i) => (
                <Box
                  key={i}
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      bgcolor: "#EFF6FF",
                      border: "1.5px solid #BFDBFE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: "1px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#2563EB",
                      }}
                    >
                      {i + 1}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.83rem",
                      color: "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setShowSuccess(false);
                navigate("/staff/payment");
              }}
              sx={{
                py: 1.4,
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(37, 99, 235, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1D4ED8, #1E40AF)",
                },
              }}
            >
              Go to Login Page
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
