import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Chip,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  CloudUploadOutlined,
  VerifiedUserOutlined,
  CheckCircleOutlined,
  PendingActionsOutlined,
  PhoneOutlined,
  BookmarkBorderOutlined,
  BookmarkAdded,
  LocationOnOutlined,
  LogoutOutlined,
  ReceiptLongOutlined,
  ArrowForwardOutlined,
  InfoOutlined,
} from "@mui/icons-material";
import imageCompression from "browser-image-compression";
import {
  lookupStaff,
  fetchStaffPendingMonths,
  submitStaffPayment,
} from "../../../api/admin/api";

export default function StaffPaymentPage() {
  const [mobile, setMobile] = useState(
    () => localStorage.getItem("staffMobile") || "",
  );
  const [staffData, setStaffData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingMonthId, setUploadingMonthId] = useState(null);
  const [bookmarkDismissed, setBookmarkDismissed] = useState(
    () => localStorage.getItem("bookmarkDismissed") === "true",
  );
  const [successMsg, setSuccessMsg] = useState("");

  const handleBookmark = () => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcut = isMac ? '⌘ + D' : 'Ctrl + D';
    alert(`Your browser does not support automatic bookmarking. Please press ${shortcut} to bookmark this page.`);
  };

  const dismissBookmark = () => {
    setBookmarkDismissed(true);
    localStorage.setItem("bookmarkDismissed", "true");
  };

  const handleLookup = async (lookupMobile = mobile) => {
    const mobileToUse =
      typeof lookupMobile === "string" ? lookupMobile : mobile;
    if (!mobileToUse || mobileToUse.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const staffRes = await lookupStaff(mobileToUse);
      if (staffRes.success) {
        setStaffData(staffRes.data);
        localStorage.setItem("staffMobile", mobileToUse);
        const paymentsRes = await fetchStaffPendingMonths(mobileToUse);
        if (paymentsRes.success) {
          setPayments(paymentsRes.data);
        }
      }
    } catch (err) {
      setError(err.message || "Staff not found or error looking up details.");
      setStaffData(null);
      setPayments([]);
      localStorage.removeItem("staffMobile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedMobile = localStorage.getItem("staffMobile");
    if (storedMobile && storedMobile.length === 10 && !staffData) {
      handleLookup(storedMobile);
    }
  }, []);

  const handleFileChange = async (e, paymentId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMonthId(paymentId);
    setError("");

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.85,
      });

      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = async () => {
        const base64data = reader.result;
        try {
          await submitStaffPayment({
            mobile,
            paymentId,
            photoBase64: base64data,
          });
          setSuccessMsg("Payment screenshot uploaded successfully!");
          setTimeout(() => setSuccessMsg(""), 4000);
          const paymentsRes = await fetchStaffPendingMonths(mobile);
          if (paymentsRes.success) {
            setPayments(paymentsRes.data);
          }
        } catch (submitErr) {
          setError(
            submitErr.message || "Failed to submit payment. Please try again.",
          );
        } finally {
          setUploadingMonthId(null);
        }
      };
    } catch {
      setError("Failed to process image. Please try another image.");
      setUploadingMonthId(null);
    }
  };

  const getMonthName = (monthNum) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString("en-US", { month: "long" });
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
      <Box sx={{ width: "100%", maxWidth: 580 }}>
        {/* ── Header ───────────────────────────────────────────────────── */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
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
            <VerifiedUserOutlined sx={{ color: "#fff", fontSize: 32 }} />
          </Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}
          >
            Staff Payment
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
            Portal
          </Typography>
          <Typography sx={{ color: "#64748B", mt: 1, fontSize: "0.9rem" }}>
            Check your monthly fee status & visit transportation office for payments
          </Typography>
        </Box>
        {/* ── Bookmark Banner ──────────────────────────────────────────── */}
        {!bookmarkDismissed && (
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              bgcolor: "#fff",
              border: "1.5px solid #E2E8F0",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BookmarkBorderOutlined sx={{ fontSize: 20, color: "#fff" }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}
              >
                Bookmark this page
              </Typography>
              <Typography
                sx={{ fontSize: "0.75rem", color: "#64748B", lineHeight: 1.4 }}
              >
                Save this link so you can quickly upload payments every month.{" "}
                <span style={{ fontWeight: 600 }}>
                  Press {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} + D
                </span>{" "}
                to bookmark.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
              <Tooltip title="Bookmark this page">
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleBookmark}
                  startIcon={<BookmarkBorderOutlined fontSize="small" />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    borderRadius: "8px",
                    bgcolor: "#F59E0B",
                    "&:hover": { bgcolor: "#D97706" },
                    boxShadow: "none",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  Bookmark
                </Button>
              </Tooltip>
              <Button
                size="small"
                onClick={dismissBookmark}
                sx={{
                  textTransform: "none",
                  color: "#94A3B8",
                  fontSize: "0.75rem",
                  minWidth: "auto",
                  p: "4px 8px",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#F1F5F9", color: "#475569" },
                }}
              >
                Dismiss
              </Button>
            </Box>
          </Box>
        )}
        {/* ── Card ─────────────────────────────────────────────────────── */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: "24px",
            p: { xs: 3, sm: 4 },
            boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
            border: "1px solid #E2E8F0",
          }}
        >
          {/* Error */}
          {error && (
            <Box
              sx={{
                mb: 3,
                p: 1.5,
                bgcolor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <InfoOutlined
                sx={{ color: "#EF4444", fontSize: 16, flexShrink: 0 }}
              />
              <Typography sx={{ color: "#EF4444", fontSize: "0.83rem" }}>
                {error}
              </Typography>
            </Box>
          )}

          {/* Success */}
          {successMsg && (
            <Box
              sx={{
                mb: 3,
                p: 1.5,
                bgcolor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CheckCircleOutlined
                sx={{ color: "#10B981", fontSize: 16, flexShrink: 0 }}
              />
              <Typography
                sx={{ color: "#065F46", fontSize: "0.83rem", fontWeight: 500 }}
              >
                {successMsg}
              </Typography>
            </Box>
          )}

          {!staffData ? (
            /* ── Lookup Form ── */
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#F8FAFC",
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  Enter your registered mobile number to check your monthly transport fee status.
                </Typography>
              </Box>

              <TextField
                label="Mobile Number"
                fullWidth
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setMobile(val);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                size="small"
                placeholder="10-digit mobile number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneOutlined sx={{ fontSize: 18, color: "#94A3B8" }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              <Button
                variant="contained"
                fullWidth
                onClick={handleLookup}
                disabled={loading}
                endIcon={!loading && <ArrowForwardOutlined />}
                sx={{
                  py: 1.5,
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  borderRadius: "12px",
                  boxShadow: "0 4px 16px rgba(37, 99, 235, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #1D4ED8, #1E40AF)",
                  },
                }}
              >
                {loading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={18} color="inherit" />
                    Looking up...
                  </Box>
                ) : (
                  "View My Payments"
                )}
              </Button>

              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                  Not registered yet?{" "}
                  <span
                    style={{
                      color: "#2563EB",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => (window.location.href = "/staff")}
                  >
                    Register here
                  </span>
                </Typography>
              </Box>
            </Box>
          ) : (
            /* ── Payments View ── */
            <Box>
              {/* Staff Info Card */}
              <Box
                sx={{
                  p: 2.5,
                  background: "linear-gradient(135deg, #1E293B, #0F172A)",
                  borderRadius: "16px",
                  mb: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem" }}
                  >
                    {staffData.name}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    <LocationOnOutlined
                      sx={{ fontSize: 14, color: "#94A3B8" }}
                    />
                    <Typography sx={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                      {staffData.pickupPoint}
                    </Typography>
                  </Box>
                  {staffData.serviceStatus !== "active" && (
                    <Chip
                      label={staffData.serviceStatus.toUpperCase()}
                      size="small"
                      sx={{
                        mt: 1,
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        bgcolor: "#F59E0B",
                        color: "#fff",
                        height: 22,
                      }}
                    />
                  )}
                </Box>
                <Button
                  size="small"
                  onClick={() => {
                    localStorage.removeItem("staffMobile");
                    setStaffData(null);
                    setMobile("");
                    setPayments([]);
                  }}
                  startIcon={<LogoutOutlined sx={{ fontSize: 16 }} />}
                  sx={{
                    textTransform: "none",
                    color: "#94A3B8",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.05)",
                      color: "#fff",
                    },
                  }}
                >
                  Logout
                </Button>
              </Box>

              {/* Section Title */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <ReceiptLongOutlined sx={{ fontSize: 18, color: "#2563EB" }} />
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#1E293B",
                    fontSize: "0.95rem",
                  }}
                >
                  Pending Months
                </Typography>
                {payments.length > 0 && (
                  <Chip
                    label={payments.length}
                    size="small"
                    sx={{
                      bgcolor: "#FEF3C7",
                      color: "#D97706",
                      fontWeight: 700,
                      height: 20,
                      fontSize: "0.7rem",
                    }}
                  />
                )}
              </Box>

              {/* Transportation Office Notice Banner */}
              {payments.length > 0 && (
                <Box
                  sx={{
                    mb: 2.5,
                    p: 2,
                    bgcolor: "#FFFBEB",
                    border: "1.5px solid #FCD34D",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                  }}
                >
                  <InfoOutlined
                    sx={{ color: "#D97706", fontSize: 22, mt: 0.2, flexShrink: 0 }}
                  />
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#92400E" }}
                    >
                      Payment Screenshot Upload Temporarily Suspended
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.82rem",
                        color: "#B45309",
                        mt: 0.4,
                        lineHeight: 1.5,
                      }}
                    >
                      Please visit the <strong>Transportation Office</strong> in person to pay your monthly fees and get details about updated fee revisions for next month.
                    </Typography>
                  </Box>
                </Box>
              )}

              {payments.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: "center",
                    border: "1.5px dashed #BBF7D0",
                    bgcolor: "#F0FDF4",
                    borderRadius: "16px",
                  }}
                >
                  <CheckCircleOutlined
                    sx={{ fontSize: 44, color: "#10B981", mb: 1 }}
                  />
                  <Typography
                    sx={{ color: "#065F46", fontWeight: 700, fontSize: "1rem" }}
                  >
                    All caught up!
                  </Typography>
                  <Typography
                    sx={{ color: "#6EE7B7", fontSize: "0.83rem", mt: 0.5 }}
                  >
                    You have no pending payments.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {payments.map((p) => (
                    <Box
                      key={p._id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        border: "1.5px solid #E2E8F0",
                        borderRadius: "14px",
                        bgcolor: "#fff",
                        transition: "box-shadow 0.15s ease",
                        "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "#0F172A",
                            fontSize: "0.92rem",
                          }}
                        >
                          {getMonthName(p.forMonth)} {p.forYear}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 0.8,
                            mt: 0.3,
                          }}
                        >
                          <Typography
                            sx={{
                              color: "#2563EB",
                              fontWeight: 800,
                              fontSize: "1.1rem",
                            }}
                          >
                            ₹{p.amount}
                          </Typography>
                          {p.isHalfMonth && (
                            <Typography
                              sx={{
                                fontSize: "0.72rem",
                                color: "#94A3B8",
                                fontWeight: 500,
                              }}
                            >
                              (Half Month)
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box>
                        {p.status === "submitted" ? (
                          <Chip
                            icon={
                              <PendingActionsOutlined
                                style={{ fontSize: 14 }}
                              />
                            }
                            label="Under Review"
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: "#DBEAFE",
                              color: "#1E3A8A",
                              fontSize: "0.75rem",
                              height: 28,
                              "& .MuiChip-icon": { color: "#1E3A8A" },
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<LocationOnOutlined style={{ fontSize: 14 }} />}
                            label="Pay at Transport Office"
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: "#FEF3C7",
                              color: "#D97706",
                              fontSize: "0.75rem",
                              height: 28,
                              "& .MuiChip-icon": { color: "#D97706" },
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
