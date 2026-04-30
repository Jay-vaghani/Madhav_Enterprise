import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  Autocomplete,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  Divider,
  Typography,
  Fade,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined,
  AccountBalanceOutlined,
  PersonOutlineOutlined,
  LocalShippingOutlined,
  CalendarMonthOutlined,
  PaymentsOutlined,
  DescriptionOutlined,
  ArrowForward,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { generateTemporaryPass, fetchAllDepartments, fetchAllPickupPoints } from "../../../api/admin/api";
import TempPassReceiptDialog from "./TempPassReceiptDialog";

const TRIP_TYPES = [
  "One Day Pass",
  "Multi-Day Pass",
  "Long-Term Pass",
  "Custom Range",
];

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#FFFFFF",
    fontSize: "0.9rem",
    transition: "all 0.2s ease-in-out",
    border: "1px solid #E2E8F0",
    "& fieldset": { border: "none" },
    "&:hover": {
      bgcolor: "#F8FAFC",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      border: "1px solid #CBD5E1",
    },
    "&.Mui-focused": {
      bgcolor: "#FFFFFF",
      boxShadow: "0 4px 12px rgba(37,99,235,0.08)",
      border: "1px solid #2563EB",
    },
  },
  "& .MuiFormHelperText-root": {
    mx: 1,
    mt: 0.5,
    fontWeight: 500,
  },
};

const sectionHeaderSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  mb: 2,
  "& .icon-box": {
    width: 32,
    height: 32,
    borderRadius: "8px",
    bgcolor: "#EFF6FF",
    color: "#2563EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  "& h3": {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#1E293B",
    letterSpacing: "-0.01em",
  },
};

const labelSx = {
  margin: "0 0 6px 4px",
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#64748B",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export default function GeneratePassTab() {
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  
  // Dynamic data from API
  const [departments, setDepartments] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch departments and pickup points
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [deptRes, pointRes] = await Promise.all([
          fetchAllDepartments(token),
          fetchAllPickupPoints(token),
        ]);
        if (deptRes.success) setDepartments(deptRes.departments);
        if (pointRes.success) setPickupPoints(pointRes.pickupPoints);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [token]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      studentName: "",
      mobileNumber: "",
      department: null,
      pickupPoint: null,
      tripType: "",
      validFrom: "",
      validTo: "",
      paymentMethod: "cash",
      feeAmount: "",
      cashAmount: "",
      bankAmount: "",
      transaction1: "",
      remarks: "",
    },
  });

  const watchedTripType = watch("tripType");
  const watchedValidFrom = watch("validFrom");
  const watchedValidTo = watch("validTo");
  const watchedPaymentMethod = watch("paymentMethod");
  const watchedFeeAmount = watch("feeAmount");
  const watchedCashAmount = watch("cashAmount");

  useEffect(() => {
    if (watchedTripType === "One Day Pass" && watchedValidFrom) {
      setValue("validTo", watchedValidFrom);
    }
  }, [watchedTripType, watchedValidFrom, setValue]);

  useEffect(() => {
    if (watchedPaymentMethod === "both") {
      const fee = Number(watchedFeeAmount) || 0;
      const cash = Number(watchedCashAmount) || 0;
      setValue("bankAmount", Math.max(0, fee - cash).toString());
    }
  }, [watchedFeeAmount, watchedCashAmount, watchedPaymentMethod, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (data.paymentMethod === "both") {
        const cash = Number(data.cashAmount) || 0;
        const bank = Number(data.bankAmount) || 0;
        const fee = Number(data.feeAmount) || 0;
        if (cash + bank !== fee) {
          setError(`Payment split mismatch: ₹${cash} + ₹${bank} != ₹${fee}`);
          setSubmitting(false);
          return;
        }
      }

      const payload = { ...data, feeAmount: Number(data.feeAmount) };
      const res = await generateTemporaryPass(token, payload);
      setSuccess(`Success! Receipt ${res.data.receiptNumber} generated.`);
      setReceiptData(res.receiptData);
      reset();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", px: 1 }}>
      <Box sx={{ maxWidth: "1200px", mx: "auto", pb: 4 }}>
        {error && (
          <Fade in>
            <Alert
              severity="error"
              onClose={() => setError("")}
              sx={{ mb: 3, borderRadius: "12px", border: "1px solid #FEE2E2" }}
            >
              {error}
            </Alert>
          </Fade>
        )}
        {success && (
          <Fade in>
            <Alert
              severity="success"
              onClose={() => setSuccess("")}
              sx={{ mb: 3, borderRadius: "12px", border: "1px solid #DCFCE7" }}
            >
              {success}
            </Alert>
          </Fade>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 5 },
              borderRadius: "28px",
              border: "1px solid #E2E8F0",
              bgcolor: "#fff",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <Box sx={sectionHeaderSx}>
                  <div className="icon-box">
                    <PersonOutlineOutlined sx={{ fontSize: 20 }} />
                  </div>
                  <Typography variant="h3">Student Information</Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <p style={labelSx}>Full Name *</p>
                <Controller
                  name="studentName"
                  control={control}
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter student name"
                      fullWidth
                      error={!!errors.studentName}
                      helperText={errors.studentName?.message}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <p style={labelSx}>Mobile Number *</p>
                <Controller
                  name="mobileNumber"
                  control={control}
                  rules={{
                    required: "Required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "10 digits required",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Mobile number"
                      fullWidth
                      error={!!errors.mobileNumber}
                      helperText={errors.mobileNumber?.message}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <p style={labelSx}>Department / College *</p>
                <Controller
                  name="department"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      options={departments}
                      getOptionLabel={(opt) => opt.label || ""}
                      value={value}
                      onChange={(_, val) => onChange(val)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search dept..."
                          error={!!errors.department}
                          helperText={errors.department?.message}
                          sx={fieldSx}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ borderStyle: "dashed", opacity: 0.6 }} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={sectionHeaderSx}>
                  <div
                    className="icon-box"
                    style={{ bgcolor: "#F0FDF4", color: "#16A34A" }}
                  >
                    <LocalShippingOutlined sx={{ fontSize: 20 }} />
                  </div>
                  <Typography variant="h3">Travel & Validity</Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <p style={labelSx}>Pickup Point *</p>
                <Controller
                  name="pickupPoint"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      options={pickupPoints}
                      getOptionLabel={(opt) => opt.label || ""}
                      value={value}
                      onChange={(_, val) => onChange(val)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select pickup..."
                          error={!!errors.pickupPoint}
                          helperText={errors.pickupPoint?.message}
                          sx={fieldSx}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <p style={labelSx}>Trip Category *</p>
                <Controller
                  name="tripType"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      error={!!errors.tripType}
                      helperText={errors.tripType?.message}
                      sx={fieldSx}
                    >
                      {TRIP_TYPES.map((t) => (
                        <MenuItem
                          key={t}
                          value={t}
                          sx={{ py: 1.5, fontSize: "0.9rem" }}
                        >
                          {t}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <p style={labelSx}>Valid From *</p>
                <Controller
                  name="validFrom"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      sx={fieldSx}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonthOutlined
                              sx={{ fontSize: 18, color: "#94A3B8" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <p style={labelSx}>Valid To *</p>
                <Controller
                  name="validTo"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      disabled={watchedTripType === "One Day Pass"}
                      sx={fieldSx}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonthOutlined
                              sx={{ fontSize: 18, color: "#94A3B8" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                {watchedTripType && (
                  <Fade in>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "16px",
                        bgcolor: "#F8FAFC",
                        border: "1px dashed #CBD5E1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#64748B",
                          textTransform: "uppercase",
                        }}
                      >
                        Active Range:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "1rem",
                          fontWeight: 800,
                          color: "#0F172A",
                        }}
                      >
                        {watchedValidFrom
                          ? new Date(watchedValidFrom).toLocaleDateString(
                              "en-IN",
                            )
                          : "—"}
                        <span style={{ margin: "0 10px", color: "#94A3B8" }}>
                          →
                        </span>
                        {watchedValidTo
                          ? new Date(watchedValidTo).toLocaleDateString("en-IN")
                          : "—"}
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ borderStyle: "dashed", opacity: 0.6 }} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={sectionHeaderSx}>
                  <div
                    className="icon-box"
                    style={{ bgcolor: "#FFF7ED", color: "#EA580C" }}
                  >
                    <PaymentsOutlined sx={{ fontSize: 20 }} />
                  </div>
                  <Typography variant="h3">Fees & Payment</Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <p style={labelSx}>Total Fee *</p>
                <Controller
                  name="feeAmount"
                  control={control}
                  rules={{ required: "Required", min: 1 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      placeholder="0"
                      sx={fieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography
                              sx={{ fontWeight: 700, color: "#0F172A" }}
                            >
                              ₹
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <p style={labelSx}>Method *</p>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth sx={fieldSx}>
                      <MenuItem value="cash" sx={{ py: 1.2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <AccountBalanceWalletOutlined
                            sx={{ fontSize: 18, color: "#64748B" }}
                          />
                          Cash
                        </Box>
                      </MenuItem>
                      <MenuItem value="bank" sx={{ py: 1.2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <AccountBalanceOutlined
                            sx={{ fontSize: 18, color: "#64748B" }}
                          />
                          Bank / UPI
                        </Box>
                      </MenuItem>
                      <MenuItem value="both" sx={{ py: 1.2 }}>
                        Mixed (Split)
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              {watchedPaymentMethod === "bank" && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <p style={labelSx}>Transaction ID *</p>
                  <Controller
                    name="transaction1"
                    control={control}
                    rules={{ required: "Required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        placeholder="UTR / Ref Number"
                        fullWidth
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
              )}

              {watchedPaymentMethod === "both" && (
                <>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <p style={labelSx}>Cash</p>
                    <Controller
                      name="cashAmount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          fullWidth
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <p style={labelSx}>Bank (Auto)</p>
                    <Controller
                      name="bankAmount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          disabled
                          fullWidth
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <p style={labelSx}>Transaction ID *</p>
                    <Controller
                      name="transaction1"
                      control={control}
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <TextField
                          placeholder="UTR"
                          {...field}
                          fullWidth
                          sx={fieldSx}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ borderStyle: "dashed", opacity: 0.6 }} />
              </Grid>

              <Grid size={{ xs: 12 }} md={8}>
                <Box sx={sectionHeaderSx}>
                  <div
                    className="icon-box"
                    style={{ bgcolor: "#F1F5F9", color: "#475569" }}
                  >
                    <DescriptionOutlined sx={{ fontSize: 20 }} />
                  </div>
                  <Typography variant="h3">Internal Remarks</Typography>
                </Box>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Notes (optional)..."
                      fullWidth
                      multiline
                      rows={3}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>

              <Grid
                size={{ xs: 12, md: 4 }}
                sx={{ display: "flex", alignItems: "flex-end", pb: 0.5 }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting}
                  endIcon={!submitting && <ArrowForward />}
                  sx={{
                    height: "64px",
                    bgcolor: "#2563EB",
                    borderRadius: "16px",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    textTransform: "none",
                    boxShadow: "0 10px 30px -10px rgba(37,99,235,0.5)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: "#1D4ED8",
                      transform: "translateY(-2px)",
                    },
                    "&.Mui-disabled": {
                      bgcolor: "#E2E8F0",
                    },
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={26} color="inherit" />
                  ) : (
                    "Generate Pass"
                  )}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </form>
      </Box>

      <TempPassReceiptDialog
        open={!!receiptData}
        receiptData={receiptData}
        onClose={() => setReceiptData(null)}
      />
    </Box>
  );
}
