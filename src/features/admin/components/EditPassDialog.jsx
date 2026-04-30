import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Box, Grid, TextField, Button, MenuItem, Autocomplete, Alert, CircularProgress, InputAdornment, IconButton
} from "@mui/material";
import { CloseOutlined, AccountBalanceWalletOutlined, AccountBalanceOutlined } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { updateTemporaryPass, fetchAllDepartments, fetchAllPickupPoints } from "../../../api/admin/api";

const TRIP_TYPES = ["One Day Pass", "Multi-Day Pass", "Long-Term Pass", "Custom Range"];

const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#FFFFFF", fontSize: "0.88rem", transition: "all 0.2s", border: "1px solid #E2E8F0", "& fieldset": { border: "none" }, "&:hover": { bgcolor: "#F8FAFC" }, "&.Mui-focused": { bgcolor: "#FFFFFF", border: "1px solid #2563EB" } }
};
const labelSx = { margin: "0 0 6px 0", fontSize: "0.7rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" };

export default function EditPassDialog({ open, passData, onClose, onSave }) {
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Dynamic data from API
  const [departments, setDepartments] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);

  // Fetch departments and pickup points
  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, pointRes] = await Promise.all([
          fetchAllDepartments(token),
          fetchAllPickupPoints(token),
        ]);
        if (deptRes.success) setDepartments(deptRes.departments);
        if (pointRes.success) setPickupPoints(pointRes.pickupPoints);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    if (open) loadData();
  }, [token, open]);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      studentName: "", mobileNumber: "", department: null, pickupPoint: null, tripType: "",
      validFrom: "", validTo: "", paymentMethod: "cash", feeAmount: "", cashAmount: "", bankAmount: "",
      transaction1: "", remarks: ""
    }
  });

  useEffect(() => {
    if (passData && open) {
      const deptObj = departments.find(d => d.id === passData.department?.id) || passData.department;
      const pickupObj = pickupPoints.find(p => p.id === passData.pickupPoint?.id) || passData.pickupPoint;
      reset({
        studentName: passData.studentName || "",
        mobileNumber: passData.mobileNumber || "",
        department: deptObj,
        pickupPoint: pickupObj,
        tripType: passData.tripType || "",
        validFrom: passData.validFrom ? new Date(passData.validFrom).toISOString().split("T")[0] : "",
        validTo: passData.validTo ? new Date(passData.validTo).toISOString().split("T")[0] : "",
        paymentMethod: passData.paymentMethod || "cash",
        feeAmount: passData.feeAmount || "",
        cashAmount: passData.cashAmount || "",
        bankAmount: passData.bankAmount || "",
        transaction1: passData.transaction1 || "",
        remarks: passData.remarks || ""
      });
      setError("");
    }
  }, [passData, open, reset]);

  const watchedTripType = watch("tripType");
  const watchedPaymentMethod = watch("paymentMethod");
  const watchedFeeAmount = watch("feeAmount");
  const watchedCashAmount = watch("cashAmount");

  useEffect(() => {
    if (watchedTripType === "One Day Pass") {
      setValue("validTo", watch("validFrom"));
    }
  }, [watchedTripType, watch("validFrom"), setValue]);

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
    try {
      if (data.paymentMethod === "both") {
        const cash = Number(data.cashAmount) || 0;
        const bank = Number(data.bankAmount) || 0;
        const fee = Number(data.feeAmount) || 0;
        if (cash + bank !== fee) {
          setError(`Cash (₹${cash}) + Bank (₹${bank}) must equal Fee (₹${fee}).`);
          setSubmitting(false);
          return;
        }
      }

      const payload = { ...data, feeAmount: Number(data.feeAmount) };
      await updateTemporaryPass(token, passData._id, payload);
      onSave();
    } catch (err) {
      setError(err.message || "Failed to update pass");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 2, borderBottom: "1px solid #E2E8F0" }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Edit Pass {passData?.receiptNumber}</h2>
        <IconButton onClick={onClose} size="small"><CloseOutlined /></IconButton>
      </Box>
      <DialogContent sx={{ p: 3, bgcolor: "#FAFBFC" }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Details */}
            <Grid item xs={12} sm={4}>
              <p style={labelSx}>Student Name *</p>
              <Controller name="studentName" control={control} rules={{ required: "Required" }} render={({ field }) => (
                <TextField {...field} size="small" fullWidth error={!!errors.studentName} helperText={errors.studentName?.message} sx={fieldSx} />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <p style={labelSx}>Mobile Number *</p>
              <Controller name="mobileNumber" control={control} rules={{ required: "Required" }} render={({ field }) => (
                <TextField {...field} size="small" fullWidth error={!!errors.mobileNumber} helperText={errors.mobileNumber?.message} sx={fieldSx} />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <p style={labelSx}>Department *</p>
              <Controller name="department" control={control} rules={{ required: "Required" }} render={({ field: { onChange, value } }) => (
                <Autocomplete
                  options={departments} getOptionLabel={(opt) => opt.label || ""} value={value} onChange={(e, val) => onChange(val)} isOptionEqualToValue={(o,v) => o.id === v.id}
                  renderInput={(params) => <TextField {...params} size="small" error={!!errors.department} helperText={errors.department?.message} sx={fieldSx} />}
                />
              )} />
            </Grid>

            {/* Travel Details */}
            <Grid item xs={12} sm={6}>
              <p style={labelSx}>Pickup Point *</p>
              <Controller name="pickupPoint" control={control} rules={{ required: "Required" }} render={({ field: { onChange, value } }) => (
                <Autocomplete
                  options={pickupPoints} getOptionLabel={(opt) => opt.label || ""} value={value} onChange={(e, val) => onChange(val)} isOptionEqualToValue={(o,v) => o.id === v.id}
                  renderInput={(params) => <TextField {...params} size="small" error={!!errors.pickupPoint} helperText={errors.pickupPoint?.message} sx={fieldSx} />}
                />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <p style={labelSx}>Trip Type *</p>
              <Controller name="tripType" control={control} rules={{ required: "Required" }} render={({ field }) => (
                <TextField {...field} select size="small" fullWidth error={!!errors.tripType} helperText={errors.tripType?.message} sx={fieldSx}>
                  {TRIP_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <p style={labelSx}>Valid From *</p>
              <Controller name="validFrom" control={control} rules={{ required: "Required" }} render={({ field }) => (
                <TextField {...field} type="date" size="small" fullWidth error={!!errors.validFrom} helperText={errors.validFrom?.message} sx={fieldSx} InputLabelProps={{ shrink: true }} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <p style={labelSx}>Valid To *</p>
              <Controller name="validTo" control={control} rules={{ required: "Required" }} render={({ field }) => (
                <TextField {...field} type="date" size="small" fullWidth disabled={watchedTripType === "One Day Pass"} error={!!errors.validTo} helperText={errors.validTo?.message} sx={fieldSx} InputLabelProps={{ shrink: true }} />
              )} />
            </Grid>

            {/* Payment Section */}
            <Grid item xs={12} sm={4}>
              <p style={labelSx}>Fee Amount *</p>
              <Controller name="feeAmount" control={control} rules={{ required: "Required", min: 0 }} render={({ field }) => (
                <TextField {...field} type="number" size="small" fullWidth error={!!errors.feeAmount} helperText={errors.feeAmount?.message} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <p style={labelSx}>Payment Method *</p>
              <Controller name="paymentMethod" control={control} rules={{ required: "Required" }} render={({ field }) => (
                <TextField {...field} select size="small" fullWidth sx={fieldSx}>
                  <MenuItem value="cash"><AccountBalanceWalletOutlined sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }}/> Cash</MenuItem>
                  <MenuItem value="bank"><AccountBalanceOutlined sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }}/> Bank/UPI</MenuItem>
                  <MenuItem value="both">Both (Split)</MenuItem>
                </TextField>
              )} />
            </Grid>

            {watchedPaymentMethod === "bank" && (
              <Grid item xs={12} sm={4}>
                <p style={labelSx}>Transaction ID *</p>
                <Controller name="transaction1" control={control} rules={{ required: "Required" }} render={({ field }) => (
                  <TextField {...field} size="small" type="tel" fullWidth error={!!errors.transaction1} helperText={errors.transaction1?.message} sx={fieldSx} />
                )} />
              </Grid>
            )}

            {watchedPaymentMethod === "both" && (
              <>
                <Grid item xs={12} sm={4}>
                  <p style={labelSx}>Cash Amount *</p>
                  <Controller name="cashAmount" control={control} rules={{ required: "Required" }} render={({ field }) => (
                    <TextField {...field} type="number" size="small" fullWidth sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                  )} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <p style={labelSx}>Bank Amount *</p>
                  <Controller name="bankAmount" control={control} render={({ field }) => (
                    <TextField {...field} type="number" size="small" fullWidth disabled sx={{ ...fieldSx, opacity: 0.8 }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                  )} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <p style={labelSx}>Transaction ID *</p>
                  <Controller name="transaction1" control={control} rules={{ required: "Required" }} render={({ field }) => (
                    <TextField {...field} size="small" type="tel" fullWidth error={!!errors.transaction1} helperText={errors.transaction1?.message} sx={fieldSx} />
                  )} />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <p style={labelSx}>Remarks (Optional)</p>
              <Controller name="remarks" control={control} render={({ field }) => (
                <TextField {...field} size="small" fullWidth multiline rows={2} sx={fieldSx} />
              )} />
            </Grid>

            <Grid item xs={12} sx={{ mt: 1, display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button onClick={onClose} sx={{ color: "#64748B", fontWeight: 600 }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting} sx={{ bgcolor: "#2563EB", px: 3, borderRadius: "10px", fontWeight: 700, "&:hover": { bgcolor: "#1D4ED8" } }}>
                {submitting ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  );
}
