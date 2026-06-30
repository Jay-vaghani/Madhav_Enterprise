import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  MenuItem,
  Tab,
  Tabs,
  Autocomplete,
} from "@mui/material";
import {
  CheckCircleOutlineRounded,
  AddCardOutlined,
} from "@mui/icons-material";
import {
  fetchPendingStaffPayments,
  approveStaffPayment,
  createManualStaffPayment,
  fetchAllStaff,
} from "../../../api/admin/api";
import { useAuth } from "../../admin/context/AuthContext";

export default function StaffPaymentsPage() {
  const { token } = useAuth();

  const [tabIndex, setTabIndex] = useState(0);

  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Approval Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [approveForm, setApproveForm] = useState({
    utrNumber: "",
    account: "",
    adminNotes: "",
  });

  // Manual Payment
  const [staffList, setStaffList] = useState([]);
  const [manualForm, setManualForm] = useState({
    staffId: null,
    forMonth: "",
    forYear: new Date().getFullYear(),
    amount: "",
    utrNumber: "",
    account: "",
    adminNotes: "",
  });

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await fetchPendingStaffPayments(token);
      if (res.success) {
        setPendingPayments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await fetchAllStaff(token, { status: "active", limit: 1000 });
      if (res.success) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPending();
    loadStaff();
  }, [token]);

  const handleApprove = async () => {
    if (!approveForm.account) {
      alert("Please select an account.");
      return;
    }
    if (approveForm.account !== "Cash" && (!approveForm.utrNumber || approveForm.utrNumber.length !== 12)) {
      alert("Please enter a valid 12-digit UTR number.");
      return;
    }

    try {
      await approveStaffPayment(token, selectedPayment._id, approveForm);
      setSelectedPayment(null);
      setApproveForm({ utrNumber: "", account: "", adminNotes: "" });
      loadPending();
    } catch (err) {
      alert(err.message || "Approval failed");
    }
  };

  const handleManualSubmit = async () => {
    if (
      !manualForm.staffId ||
      !manualForm.forMonth ||
      !manualForm.forYear ||
      !manualForm.amount ||
      !manualForm.account
    ) {
      alert("Please fill all required fields.");
      return;
    }
    if (manualForm.account !== "Cash" && (!manualForm.utrNumber || manualForm.utrNumber.length !== 12)) {
      alert("Please enter a valid 12-digit UTR number.");
      return;
    }

    try {
      await createManualStaffPayment(token, {
        ...manualForm,
        staffId: manualForm.staffId._id,
      });
      alert("Manual payment created successfully.");
      setManualForm({
        staffId: null,
        forMonth: "",
        forYear: new Date().getFullYear(),
        amount: "",
        utrNumber: "",
        account: "",
        adminNotes: "",
      });
    } catch (err) {
      alert(err.message || "Manual payment creation failed");
    }
  };

  const getMonthName = (monthNum) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString("en-US", { month: "long" });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: "#0F172A", mb: 3 }}
      >
        Staff Payments
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
          <Tab
            label="Pending Approvals"
            sx={{ fontWeight: 600, textTransform: "none" }}
          />
          <Tab
            label="Manual Entry"
            sx={{ fontWeight: 600, textTransform: "none" }}
          />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Box>
          {loading ? (
            <CircularProgress />
          ) : pendingPayments.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "#64748B" }}>
                No pending payments to approve.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {pendingPayments.map((p) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p._id}>
                  <Card
                    sx={{
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={p.screenshotUrl}
                      alt="Payment Screenshot"
                      sx={{ cursor: "pointer", objectFit: "cover" }}
                      onClick={() => window.open(p.screenshotUrl, "_blank")}
                    />
                    <CardContent>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                        {p.staffName}
                      </Typography>
                      <Typography
                        sx={{ color: "#64748B", fontSize: "0.875rem", mb: 2 }}
                      >
                        {p.staffMobile}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Typography sx={{ fontWeight: 600 }}>
                          {getMonthName(p.forMonth)} {p.forYear}
                        </Typography>
                        <Typography sx={{ color: "#2563EB", fontWeight: 700 }}>
                          ₹{p.amount}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<CheckCircleOutlineRounded />}
                        onClick={() => setSelectedPayment(p)}
                      >
                        Approve Payment
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {tabIndex === 1 && (
        <Box sx={{ maxWidth: 600 }}>
          <Typography sx={{ mb: 3, color: "#475569" }}>
            Create a manual payment entry for a staff member who paid by cash or
            another untracked method.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Autocomplete
              options={staffList}
              getOptionLabel={(option) => `${option.name} (${option.mobile})`}
              value={manualForm.staffId}
              onChange={(_, newValue) => {
                setManualForm((prev) => ({
                  ...prev,
                  staffId: newValue,
                  amount: newValue ? newValue.pickupPoint?.fee || "" : "",
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Staff *" />
              )}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                select
                label="Month *"
                fullWidth
                value={manualForm.forMonth}
                onChange={(e) =>
                  setManualForm((prev) => ({
                    ...prev,
                    forMonth: e.target.value,
                  }))
                }
              >
                {[...Array(12)].map((_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Year *"
                fullWidth
                type="tel"
                value={manualForm.forYear}
                onChange={(e) =>
                  setManualForm((prev) => ({
                    ...prev,
                    forYear: e.target.value,
                  }))
                }
              />
            </Box>

            <TextField
              label="Amount (₹) *"
              fullWidth
              type="tel"
              value={manualForm.amount}
              onChange={(e) =>
                setManualForm((prev) => ({ ...prev, amount: e.target.value }))
              }
            />

            <TextField
              select
              label="Account *"
              fullWidth
              value={manualForm.account}
              onChange={(e) =>
                setManualForm((prev) => ({ ...prev, account: e.target.value }))
              }
            >
              <MenuItem value="C">Account C</MenuItem>
              <MenuItem value="H">Account H</MenuItem>
              <MenuItem value="S">Account S</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
            </TextField>

            {manualForm.account !== "Cash" && (
              <TextField
                label="UTR / Transaction Number (12 Digits)"
                fullWidth
                type="tel"
                inputProps={{ maxLength: 12 }}
                value={manualForm.utrNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 12) {
                    setManualForm((prev) => ({ ...prev, utrNumber: val }));
                  }
                }}
              />
            )}

            <TextField
              label="Admin Notes"
              fullWidth
              multiline
              rows={2}
              value={manualForm.adminNotes}
              onChange={(e) =>
                setManualForm((prev) => ({
                  ...prev,
                  adminNotes: e.target.value,
                }))
              }
            />

            <Button
              variant="contained"
              startIcon={<AddCardOutlined />}
              onClick={handleManualSubmit}
              sx={{ py: 1.5, mt: 1 }}
            >
              Submit Manual Payment
            </Button>
          </Box>
        </Box>
      )}

      {/* Approval Dialog */}
      <Dialog
        open={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve Payment</DialogTitle>
        <DialogContent>
          <Box
            sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              select
              label="Select Account *"
              fullWidth
              value={approveForm.account}
              onChange={(e) =>
                setApproveForm((prev) => ({ ...prev, account: e.target.value }))
              }
            >
              <MenuItem value="C">Account C</MenuItem>
              <MenuItem value="H">Account H</MenuItem>
              <MenuItem value="S">Account S</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
            </TextField>

            {approveForm.account !== "Cash" && (
              <TextField
                label="UTR / Transaction Number (12 Digits)"
                fullWidth
                type="tel"
                inputProps={{ maxLength: 12 }}
                value={approveForm.utrNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 12) {
                    setApproveForm((prev) => ({ ...prev, utrNumber: val }));
                  }
                }}
                helperText="Enter the 12-digit UTR number verified from the screenshot."
              />
            )}

            <TextField
              label="Notes (Optional)"
              fullWidth
              multiline
              rows={2}
              value={approveForm.adminNotes}
              onChange={(e) =>
                setApproveForm((prev) => ({
                  ...prev,
                  adminNotes: e.target.value,
                }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setSelectedPayment(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleApprove} color="success">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
