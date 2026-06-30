import React, { useState, useRef } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  Close,
  PhotoCamera,
  WarningAmber,
  CheckCircle,
  ArrowForward,
  Block,
  Person,
  Phone,
  BadgeOutlined,
  LocationOnOutlined,
  CameraAlt,
} from "@mui/icons-material";
import {
  checkOffenceHistory,
  submitConfiscation,
} from "../../../api/checker/confiscationApi";
import ImageCropModal from "../../../components/ImageCropModal";

// ── Styled TextField helper ───────────────────────────────────────────────────
function FormField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <TextField
      label={label}
      variant="outlined"
      type={type}
      fullWidth
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "14px",
          bgcolor: "#F8FAFC",
          fontSize: "0.95rem",
          "& fieldset": { borderColor: "#E2E8F0" },
          "&:hover fieldset": { borderColor: "#10B981" },
          "&.Mui-focused fieldset": { borderColor: "#10B981", borderWidth: 2 },
        },
        "& .MuiInputLabel-root.Mui-focused": { color: "#10B981" },
      }}
    />
  );
}

// ── Progress step dots ────────────────────────────────────────────────────────
function StepDots({ current }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {[1, 2].map((s) => (
        <Box
          key={s}
          sx={{
            width: s === current ? 20 : 8,
            height: 8,
            borderRadius: "100px",
            bgcolor:
              s === current ? "#10B981" : s < current ? "#A7F3D0" : "#E2E8F0",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ConfiscationFormSheet({ open, onClose, token }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Data
  const [mobile, setMobile] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [studentName, setStudentName] = useState("");
  const [checkerNote, setCheckerNote] = useState("");
  const [photoBase64, setPhotoBase64] = useState(null);
  const [offenceCount, setOffenceCount] = useState(0);

  // Image
  const fileInputRef = useRef(null);
  const [rawImageSrc, setRawImageSrc] = useState(null);

  const resetForm = () => {
    setStep(1);
    setMobile("");
    setEnrollment("");
    setStudentName("");
    setCheckerNote("");
    setPhotoBase64(null);
    setOffenceCount(0);
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNextStep1 = async () => {
    if (!mobile || mobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await checkOffenceHistory(mobile, token);
    if (res?.success) {
      setOffenceCount(res.offenceCount);
      if (res.offenceCount > 0) {
        setStudentName(res.studentName || "");
      }
      setStep(2);
    } else {
      setError(res?.message || "Failed to check history. Try again.");
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setRawImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const handleCropComplete = (compressedBase64) => {
    setPhotoBase64(compressedBase64);
    setRawImageSrc(null);
  };

  const handleSubmit = async () => {
    if (!studentName.trim()) {
      setError("Student name is required.");
      return;
    }
    if (!photoBase64 && offenceCount === 0) {
      setError("A photo of the student is required for first-time offenders.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await submitConfiscation(
      {
        mobile,
        enrollmentNumber: enrollment,
        studentName,
        checkerNote,
        photoBase64,
      },
      token,
    );
    if (res?.success) {
      setSuccess(true);
    } else {
      setError(res?.message || "Failed to log confiscation. Try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "92vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* ── Drag handle ── */}
        <Box
          sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5 }}
        >
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: "100px",
              bgcolor: "#E2E8F0",
            }}
          />
        </Box>

        {/* ── Header ── */}
        <Box
          sx={{
            px: 3,
            pt: 1.5,
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="800" color="#0F172A">
              Log ID Confiscation
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}
            >
              <StepDots current={step} />
              <Typography variant="caption" color="#94A3B8" fontWeight="600">
                Step {step} of 2
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              bgcolor: "#F1F5F9",
              width: 34,
              height: 34,
              "&:hover": { bgcolor: "#E2E8F0" },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* ── Scrollable body ── */}
        <Box sx={{ overflowY: "auto", flex: 1, px: 3, pt: 2.5, pb: 3 }}>
          {/* ── Error Banner ── */}
          {error && (
            <Box
              sx={{
                bgcolor: "#FEF2F2",
                color: "#DC2626",
                p: 2,
                borderRadius: "12px",
                mb: 2.5,
                fontWeight: 600,
                fontSize: "0.85rem",
                border: "1px solid #FECACA",
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <Block sx={{ fontSize: 18, flexShrink: 0, mt: 0.1 }} />
              {error}
            </Box>
          )}

          {/* ── Success Screen ── */}
          {success ? (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  bgcolor: "#ECFDF5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid #A7F3D0",
                }}
              >
                <CheckCircle sx={{ color: "#10B981", fontSize: 38 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="800" color="#0F172A">
                  Confiscation Logged
                </Typography>
                <Typography variant="body2" color="#64748B" sx={{ mt: 0.5 }}>
                  The incident has been recorded successfully.
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={handleClose}
                sx={{
                  mt: 1,
                  bgcolor: "#10B981",
                  borderRadius: "14px",
                  py: 1.8,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Done
              </Button>
            </Box>
          ) : (
            <>
              {/* ────────── STEP 1 ────────── */}
              {step === 1 && (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  <Box
                    sx={{
                      bgcolor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "14px",
                      p: 2,
                      display: "flex",
                      gap: 1.5,
                      alignItems: "center",
                    }}
                  >
                    <Person
                      sx={{ color: "#10B981", fontSize: 20, flexShrink: 0 }}
                    />
                    <Typography
                      variant="body2"
                      color="#065F46"
                      fontWeight="600"
                    >
                      Enter the student's mobile number. The system will
                      automatically check for any previous offences.
                    </Typography>
                  </Box>

                  {/* Mobile */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight="700"
                      color="#64748B"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mb: 0.75,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <Phone sx={{ fontSize: 12 }} /> Mobile Number
                    </Typography>
                    <TextField
                      variant="outlined"
                      type="tel"
                      fullWidth
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      inputProps={{ maxLength: 10 }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "14px",
                          bgcolor: "#F8FAFC",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          "& fieldset": { borderColor: "#E2E8F0" },
                          "&:hover fieldset": { borderColor: "#10B981" },
                          "&.Mui-focused fieldset": {
                            borderColor: "#10B981",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Enrollment */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight="700"
                      color="#64748B"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mb: 0.75,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <BadgeOutlined sx={{ fontSize: 12 }} /> Enrollment No.
                      (Optional)
                    </Typography>
                    <FormField
                      value={enrollment}
                      onChange={(e) => setEnrollment(e.target.value)}
                      placeholder="e.g. EN2024001"
                    />
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleNextStep1}
                    disabled={loading || mobile.length < 10}
                    endIcon={!loading && <ArrowForward />}
                    sx={{
                      mt: 1,
                      bgcolor: "#10B981",
                      borderRadius: "14px",
                      py: 1.8,
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      boxShadow: "0 4px 20px rgba(16,185,129,0.25)",
                      "&:hover": {
                        bgcolor: "#059669",
                        boxShadow: "0 6px 24px rgba(16,185,129,0.35)",
                      },
                      "&.Mui-disabled": {
                        bgcolor: "#E2E8F0",
                        color: "#94A3B8",
                        boxShadow: "none",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Check & Continue"
                    )}
                  </Button>
                </Box>
              )}

              {/* ────────── STEP 2 ────────── */}
              {step === 2 && (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                  {/* Repeat offender warning */}
                  {offenceCount > 0 ? (
                    <Box
                      sx={{
                        bgcolor: "#FFFBEB",
                        border: "1px solid #FDE68A",
                        borderRadius: "14px",
                        p: 2,
                        display: "flex",
                        gap: 1.5,
                        alignItems: "flex-start",
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          bgcolor: "#FEF3C7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <WarningAmber sx={{ color: "#D97706", fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          color="#92400E"
                          fontWeight="800"
                        >
                          ⚠ Repeat Offender — {offenceCount} prior{" "}
                          {offenceCount === 1 ? "offence" : "offences"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="#B45309"
                          sx={{ mt: 0.25, display: "block" }}
                        >
                          Details have been pre-filled from the last recorded
                          incident.
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        bgcolor: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        borderRadius: "14px",
                        p: 2,
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                      }}
                    >
                      <CheckCircle
                        sx={{ color: "#10B981", fontSize: 20, flexShrink: 0 }}
                      />
                      <Typography
                        variant="body2"
                        color="#065F46"
                        fontWeight="600"
                      >
                        First offence — no prior incidents on record.
                      </Typography>
                    </Box>
                  )}

                  {/* Student name */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight="700"
                      color="#64748B"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mb: 0.75,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <Person sx={{ fontSize: 12 }} /> Student Name *
                    </Typography>
                    <FormField
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Full name"
                    />
                  </Box>

                  {/* Checker note */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight="700"
                      color="#64748B"
                      sx={{
                        mb: 0.75,
                        display: "block",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Note (Optional)
                    </Typography>
                    <TextField
                      multiline
                      rows={2}
                      fullWidth
                      value={checkerNote}
                      onChange={(e) => setCheckerNote(e.target.value)}
                      placeholder="Any additional observations..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "14px",
                          bgcolor: "#F8FAFC",
                          fontSize: "0.9rem",
                          "& fieldset": { borderColor: "#E2E8F0" },
                          "&:hover fieldset": { borderColor: "#10B981" },
                          "&.Mui-focused fieldset": {
                            borderColor: "#10B981",
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Photo upload */}
                  {offenceCount === 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight="700"
                        color="#64748B"
                        sx={{
                          mb: 0.75,
                          display: "block",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Photo Evidence *
                      </Typography>

                      {photoBase64 ? (
                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            height: 180,
                            borderRadius: "16px",
                            overflow: "hidden",
                            border: "2px solid #A7F3D0",
                          }}
                        >
                          <Avatar
                            src={photoBase64}
                            variant="square"
                            sx={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 0,
                            }}
                          />
                          {/* Overlay retake button */}
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 10,
                              right: 10,
                            }}
                          >
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={
                                <CameraAlt
                                  sx={{ fontSize: "14px !important" }}
                                />
                              }
                              onClick={() => fileInputRef.current?.click()}
                              sx={{
                                bgcolor: "rgba(0,0,0,0.6)",
                                backdropFilter: "blur(4px)",
                                color: "#fff",
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                                boxShadow: "none",
                              }}
                            >
                              Retake
                            </Button>
                          </Box>
                          {/* Delete button */}
                          <IconButton
                            size="small"
                            onClick={() => setPhotoBase64(null)}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "#EF4444",
                              color: "#fff",
                              width: 28,
                              height: 28,
                              "&:hover": { bgcolor: "#DC2626" },
                            }}
                          >
                            <Close sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          onClick={() => fileInputRef.current?.click()}
                          sx={{
                            width: "100%",
                            height: 140,
                            borderRadius: "16px",
                            border: "2px dashed #CBD5E1",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            cursor: "pointer",
                            bgcolor: "#F8FAFC",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: "#10B981",
                              bgcolor: "#F0FDF4",
                            },
                            "&:active": { scale: "0.98" },
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: "14px",
                              bgcolor: "#E2E8F0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <PhotoCamera
                              sx={{ color: "#94A3B8", fontSize: 24 }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            color="#64748B"
                          >
                            Tap to take photo
                          </Typography>
                          <Typography variant="caption" color="#94A3B8">
                            Photo will be compressed automatically
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />

                  {/* Actions */}
                  <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setStep(1);
                        setError("");
                      }}
                      sx={{
                        borderRadius: "14px",
                        fontWeight: 700,
                        textTransform: "none",
                        borderColor: "#E2E8F0",
                        color: "#64748B",
                        py: 1.6,
                        flex: "0 0 auto",
                        px: 2.5,
                        "&:hover": {
                          borderColor: "#CBD5E1",
                          bgcolor: "#F8FAFC",
                        },
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSubmit}
                      disabled={
                        loading ||
                        (!photoBase64 && offenceCount === 0) ||
                        !studentName.trim()
                      }
                      sx={{
                        bgcolor: "#EF4444",
                        borderRadius: "14px",
                        py: 1.6,
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        boxShadow: "0 4px 20px rgba(239,68,68,0.3)",
                        "&:hover": {
                          bgcolor: "#DC2626",
                          boxShadow: "0 6px 24px rgba(239,68,68,0.4)",
                        },
                        "&.Mui-disabled": {
                          bgcolor: "#E2E8F0",
                          color: "#94A3B8",
                          boxShadow: "none",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={22} color="inherit" />
                      ) : (
                        "Log Confiscation"
                      )}
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Drawer>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={!!rawImageSrc}
        imageSrc={rawImageSrc}
        onClose={() => setRawImageSrc(null)}
        onComplete={handleCropComplete}
      />
    </>
  );
}
