import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  MenuItem,
  IconButton,
  Avatar,
  Tabs,
  Tab,
  Autocomplete,
  Tooltip,
  Badge,
  InputLabel,
  Alert,
  Divider,
  Collapse,
  Select,
  FormControl,
} from "@mui/material";
import {
  SearchOutlined,
  CloseOutlined,
  PlayArrowOutlined,
  StopCircleOutlined,
  EditOutlined,
  DeleteOutlineOutlined,
  CheckCircleOutlineOutlined,
  ReceiptLongOutlined,
  AddCardOutlined,
  ImageOutlined,
  PersonOutlined,
  OpenInNewOutlined,
  BadgeOutlined,
  PhoneOutlined,
  SchoolOutlined,
  LocationOnOutlined,
  DownloadOutlined,
  FilterListOutlined,
  CameraAltOutlined,
  SaveOutlined,
  WarningAmberOutlined,
  SwapHorizOutlined,
} from "@mui/icons-material";
import {
  fetchAllStaff,
  fetchStaffById,
  activateStaffService,
  deactivateStaffService,
  updateStaff,
  updateStaffPhoto,
  deleteStaff,
  fetchPendingStaffPayments,
  approveStaffPayment,
  createManualStaffPayment,
  fetchAllStaffPickupPoints,
  updateStaffPaymentAmount,
  updateStaffPaymentDetails,
  deleteStaffPayment,
  fetchStaffPendingSummary,
} from "../../../api/admin/api";
import { useAuth } from "../../admin/context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const FULL_MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getStatusColor(status) {
  if (status === "active") return "success";
  if (status === "deactivated") return "error";
  return "warning";
}

function getPaymentStatusColor(status) {
  if (status === "approved") return "success";
  if (status === "submitted") return "info";
  return "default";
}

function initials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ─── Staff Card ───────────────────────────────────────────────────────────────

function StaffCard({ staff, pendingCount, onClick }) {
  const statusColors = {
    active: { bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
    inactive: { bg: "#FEF3C7", text: "#B45309", dot: "#F59E0B" },
    deactivated: { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
  };
  const sc = statusColors[staff.serviceStatus] || statusColors.inactive;
  const hasPending = pendingCount > 0 && staff.serviceStatus !== "deactivated";

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: "#fff",
        borderRadius: "16px",
        border: "1px solid #E8EDF5",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        "&:hover": {
          boxShadow: "0 8px 32px rgba(15,23,42,0.10)",
          transform: "translateY(-2px)",
        },
        "&:active": { transform: "translateY(0)" },
      }}
    >
      {/* Coloured left accent bar */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: sc.dot,
          borderRadius: "16px 0 0 16px",
        }}
      />

      <Box sx={{ pl: "20px", pr: 2, py: 2 }}>
        {/* ── Row 1: Avatar + Name + Status pill ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <Badge
              badgeContent={hasPending ? pendingCount : 0}
              color="warning"
              invisible={!hasPending}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  minWidth: 18,
                  height: 18,
                },
              }}
            >
              <Avatar
                src={staff.profileImageUrl || undefined}
                variant="rounded"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  bgcolor: "#2563EB",
                  fontSize: "1rem",
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {!staff.profileImageUrl && initials(staff.name)}
              </Avatar>
            </Badge>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "0.9rem", sm: "0.97rem" },
                  color: "#0F172A",
                  lineHeight: 1.25,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {staff.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  color: "#64748B",
                  mt: 0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {staff.schoolOrCollege || staff.department || "—"}
              </Typography>
            </Box>
          </Box>

          {/* Status pill — always top-right */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                px: 1.2,
                py: 0.3,
                borderRadius: "20px",
                bgcolor: sc.bg,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: sc.dot,
                }}
              />
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: sc.text,
                  letterSpacing: "0.03em",
                }}
              >
                {staff.serviceStatus.toUpperCase()}
              </Typography>
            </Box>
            {hasPending && (
              <Box
                sx={{
                  px: 1.1,
                  py: 0.2,
                  borderRadius: "20px",
                  bgcolor: "#FEF3C7",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                }}
              >
                <ReceiptLongOutlined sx={{ fontSize: 10, color: "#B45309" }} />
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#B45309",
                  }}
                >
                  {pendingCount} Pending
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* ── Divider ── */}
        <Box sx={{ height: "1px", bgcolor: "#F1F5F9", my: 1.5 }} />

        {/* ── Row 2: Details grid ── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "auto auto auto auto" },
            gap: { xs: "10px 16px", sm: "0 24px" },
          }}
        >
          {/* Pickup */}
          <Box>
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Pickup
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1E293B",
                mt: 0.3,
                display: "flex",
                alignItems: "center",
                gap: 0.4,
              }}
            >
              <LocationOnOutlined
                sx={{ fontSize: 12, color: "#94A3B8", flexShrink: 0 }}
              />
              {staff.pickupPoint?.label || staff.pickupPoint || "Unknown"}
            </Typography>
          </Box>

          {/* Fee */}
          <Box>
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Fee
            </Typography>
            <Typography
              sx={{
                fontSize: "0.88rem",
                fontWeight: 800,
                color: "#2563EB",
                mt: 0.3,
              }}
            >
              ₹{staff.pickupPoint?.fee || 0}
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 500,
                  color: "#94A3B8",
                }}
              >
                /mo
              </span>
            </Typography>
          </Box>

          {/* Shift */}
          <Box>
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Shift
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1E293B",
                mt: 0.3,
              }}
            >
              {staff.shift || "—"}
            </Typography>
          </Box>

          {/* Mobile */}
          <Box>
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Mobile
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "#475569",
                mt: 0.3,
                display: "flex",
                alignItems: "center",
                gap: 0.4,
              }}
            >
              <PhoneOutlined sx={{ fontSize: 12, color: "#94A3B8" }} />
              {staff.mobile}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Payment Row ──────────────────────────────────────────────────────────────

function PaymentRow({ payment, onApprove, onManualEntry, onRefresh, token }) {
  const [approveForm, setApproveForm] = useState({
    utrNumber: "",
    account: "",
    adminNotes: "",
  });
  const [open, setOpen] = useState(false);

  // Full edit dialog (all statuses)
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: String(payment.amount),
    utrNumber: payment.utrNumber || "",
    account: payment.account || "",
    adminNotes: payment.adminNotes || "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openEditDialog = () => {
    setEditForm({
      amount: String(payment.amount),
      utrNumber: payment.utrNumber || "",
      account: payment.account || "",
      adminNotes: payment.adminNotes || "",
    });
    setEditOpen(true);
  };

  const handleApprove = async () => {
    if (!approveForm.account) {
      alert("Please select an account.");
      return;
    }
    if (
      approveForm.account !== "Cash" &&
      (!approveForm.utrNumber || approveForm.utrNumber.length !== 12)
    ) {
      alert("Please enter a valid 12-digit UTR number.");
      return;
    }
    await onApprove(payment._id, approveForm);
    setOpen(false);
    setApproveForm({ utrNumber: "", account: "", adminNotes: "" });
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      await updateStaffPaymentDetails(token, payment._id, {
        amount: Number(editForm.amount),
        utrNumber: editForm.utrNumber,
        account: editForm.account,
        adminNotes: editForm.adminNotes,
      });
      setEditOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || "Failed to save");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStaffPayment(token, payment._id);
      setDeleteOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          bgcolor: payment.status === "submitted" ? "#FFFBEB" : "#fff",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        {/* Month + Amount */}
        <Box sx={{ minWidth: 110 }}>
          <Typography sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.9rem" }}>
            {MONTH_NAMES[payment.forMonth]} {payment.forYear}
          </Typography>
          <Typography sx={{ color: "#2563EB", fontWeight: 700 }}>
            ₹{payment.amount}
            {payment.isHalfMonth && (
              <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 400, marginLeft: 4 }}>
                (half)
              </span>
            )}
          </Typography>
        </Box>

        {/* Screenshot thumbnail */}
        <Box sx={{ flexShrink: 0 }}>
          {payment.screenshotUrl ? (
            <Tooltip title="View screenshot">
              <Box
                component="img"
                src={payment.screenshotUrl}
                alt="Screenshot"
                onClick={() => window.open(payment.screenshotUrl, "_blank")}
                sx={{
                  width: 36, height: 36, objectFit: "cover",
                  borderRadius: "8px", cursor: "pointer",
                  border: "1px solid #E2E8F0",
                  "&:hover": { borderColor: "#94A3B8" },
                }}
              />
            </Tooltip>
          ) : (
            <Box sx={{ width: 34, height: 34, borderRadius: "8px", bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageOutlined sx={{ fontSize: 18, color: "#CBD5E1" }} />
            </Box>
          )}
        </Box>

        {/* UTR / Notes */}
        <Box sx={{ flex: 1, minWidth: 80, display: "flex", flexDirection: "column" }}>
          <Typography sx={{ color: "#64748B", fontSize: "0.78rem" }}>
            {payment.utrNumber ? `UTR: ${payment.utrNumber}` : payment.adminNotes || "—"}
          </Typography>
          {payment.status === "approved" && payment.approvedAt && (
            <Typography sx={{ color: "#94A3B8", fontSize: "0.7rem", fontWeight: 500, mt: 0.5 }}>
              Approved: {new Date(payment.approvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Typography>
          )}
        </Box>

        {/* Status + Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Chip
            label={payment.status.toUpperCase()}
            size="small"
            color={getPaymentStatusColor(payment.status)}
            sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22, mr: 0.5 }}
          />

          {/* Edit icon — opens full dialog for every status */}
          <Tooltip title="Edit entry">
            <IconButton size="small" onClick={openEditDialog} sx={{ color: "#94A3B8", "&:hover": { color: "#2563EB" } }}>
              <EditOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Delete icon — available on every row */}
          <Tooltip title="Delete entry">
            <IconButton size="small" onClick={() => setDeleteOpen(true)} sx={{ color: "#94A3B8", "&:hover": { color: "#EF4444" } }}>
              <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Approve button for submitted */}
          {payment.status === "submitted" && (
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<CheckCircleOutlineOutlined />}
              onClick={() => setOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.78rem", borderRadius: "8px", ml: 0.5 }}
            >
              Approve
            </Button>
          )}

          {/* Manual Entry button for pending */}
          {payment.status === "pending" && onManualEntry && (
            <Button
              variant="outlined"
              size="small"
              onClick={onManualEntry}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.78rem", borderRadius: "8px", ml: 0.5 }}
            >
              Manual Entry
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Approve Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Approve — {FULL_MONTH_NAMES[payment.forMonth]} {payment.forYear}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {payment.screenshotUrl && (
              <Box
                component="img"
                src={payment.screenshotUrl}
                alt="Screenshot"
                onClick={() => window.open(payment.screenshotUrl, "_blank")}
                sx={{ width: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "12px", border: "1px solid #E2E8F0", bgcolor: "#F8FAFC", cursor: "pointer", mb: 1 }}
              />
            )}
            <TextField select label="Select Account *" fullWidth size="small" value={approveForm.account} onChange={(e) => setApproveForm((prev) => ({ ...prev, account: e.target.value }))}>
              <MenuItem value="C">Account C</MenuItem>
              <MenuItem value="H">Account H</MenuItem>
              <MenuItem value="S">Account S</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
            </TextField>
            {approveForm.account !== "Cash" && (
              <TextField
                label="UTR / Transaction Number (12 Digits)"
                fullWidth size="small" type="tel"
                inputProps={{ maxLength: 12 }}
                value={approveForm.utrNumber}
                onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 12) setApproveForm((prev) => ({ ...prev, utrNumber: val })); }}
              />
            )}
            <TextField label="Notes (Optional)" fullWidth size="small" multiline rows={2} value={approveForm.adminNotes} onChange={(e) => setApproveForm((prev) => ({ ...prev, adminNotes: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove} sx={{ textTransform: "none", fontWeight: 600 }}>Confirm Approval</Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog (all statuses) ────────────────────────────────────── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "20px" } }}>
        <Box sx={{ p: 3, pb: 2, background: "linear-gradient(135deg, #2563EB, #1D4ED8)", borderRadius: "10px 10px 0 0" }}>
          <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: "1rem" }}>Edit Payment Entry</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", mt: 0.5 }}>
            {FULL_MONTH_NAMES[payment.forMonth]} {payment.forYear} · {payment.status.toUpperCase()}
          </Typography>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Amount (₹)" type="number" fullWidth size="small" value={editForm.amount} onChange={(e) => setEditForm(p => ({ ...p, amount: e.target.value }))} />
            <TextField select label="Account" fullWidth size="small" value={editForm.account} onChange={(e) => setEditForm(p => ({ ...p, account: e.target.value }))}>
              <MenuItem value="C">Account C</MenuItem>
              <MenuItem value="H">Account H</MenuItem>
              <MenuItem value="S">Account S</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
            </TextField>
            {editForm.account !== "Cash" && (
              <TextField label="UTR / Transaction Number" fullWidth size="small" value={editForm.utrNumber} onChange={(e) => setEditForm(p => ({ ...p, utrNumber: e.target.value.replace(/\D/g, "").slice(0, 12) }))} />
            )}
            <TextField label="Notes" fullWidth size="small" multiline rows={2} value={editForm.adminNotes} onChange={(e) => setEditForm(p => ({ ...p, adminNotes: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: "none", color: "#64748B" }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={savingEdit}
            startIcon={savingEdit ? <CircularProgress size={14} /> : <SaveOutlined />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", bgcolor: "#2563EB" }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}>
        <Box sx={{ p: 3, textAlign: "center", bgcolor: "#fff" }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: "#FEF2F2", color: "#EF4444", mx: "auto", mb: 2 }}>
            <DeleteOutlineOutlined sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", mb: 1 }}>Delete Payment Entry</Typography>
          <Typography variant="body2" sx={{ color: "#64748B", lineHeight: 1.6, mb: 3 }}>
            Delete the <strong>{FULL_MONTH_NAMES[payment.forMonth]} {payment.forYear}</strong> payment of <strong>₹{payment.amount}</strong>?
            {payment.status === "approved" && (
              <><br /><span style={{ color: "#EF4444", fontWeight: 600 }}>⚠ This is an approved payment.</span></>
            )}
            {" "}This cannot be undone.
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setDeleteOpen(false)}
              sx={{ flex: 1, textTransform: "none", fontWeight: 700, borderRadius: "10px", color: "#64748B", borderColor: "#E2E8F0" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={14} /> : <DeleteOutlineOutlined />}
              sx={{ flex: 1, textTransform: "none", fontWeight: 700, borderRadius: "10px", boxShadow: "none" }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────


// ─── Main Page ────────────────────────────────────────────────────────────────


export default function StaffManagementPage() {
  const { token } = useAuth();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  // Pending payment counts per staff (for badge)
  const [pendingCounts, setPendingCounts] = useState({});
  const [pendingScreenshots, setPendingScreenshots] = useState(new Set());
  const [pendingFilter, setPendingFilter] = useState("all");
  const [pendingSubmittedCounts, setPendingSubmittedCounts] = useState({});
  const [pendingSummaryData, setPendingSummaryData] = useState([]);

  // Selected staff detail modal
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffDetails, setStaffDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState(0); // 0 = profile, 1 = payments

  const [actionModal, setActionModal] = useState({ type: null, data: null });
  const [actionDate, setActionDate] = useState("");
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editFormServerError, setEditFormServerError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    schoolOrCollege: "",
    shift: "",
    residentialAddress: "",
    joiningDate: "",
    pickupPoint: "",
    serviceStartDate: "",
    serviceEndDate: "",
  });

  // Manual payment
  const [manualForm, setManualForm] = useState({
    staffId: null,
    forMonth: "",
    forYear: new Date().getFullYear(),
    amount: "",
    utrNumber: "",
    account: "",
    adminNotes: "",
  });
  const [showManualModal, setShowManualModal] = useState(false);

  // Confirmation dialog state (used for pickup point change + delete)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmColor: "primary",
    confirmLabel: "Confirm",
  });

  // Profile photo upload state
  const [photoUploading, setPhotoUploading] = useState(false);

  // Pickup Points for dropdown
  const [pickupPoints, setPickupPoints] = useState([]);

  // ── Load all staff ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllStaff(token, { limit: 1000 });
      if (res.success) {
        setStaff(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ── Load pending payment counts for badges ─────────────────────────────────
  const loadPendingCounts = useCallback(async () => {
    try {
      const [res, summaryRes] = await Promise.all([
        fetchPendingStaffPayments(token),
        fetchStaffPendingSummary(token),
      ]);
      if (res.success) {
        // allCounts = total unpaid months (pending + submitted) — used for the filter
        const allCounts = {};
        // submittedCounts = only screenshot-submitted awaiting approval — used for header badge
        const submittedCounts = {};
        const withScreenshot = new Set();
        res.data.forEach((p) => {
          const id = p.staffId?._id?.toString() || p.staffId?.toString() || "";
          if (!id) return;
          allCounts[id] = (allCounts[id] || 0) + 1;
          if (p.status === "submitted") {
            submittedCounts[id] = (submittedCounts[id] || 0) + 1;
            withScreenshot.add(id);
          }
        });
        setPendingCounts(allCounts);
        setPendingScreenshots(withScreenshot);
        // Store submitted-only counts for the header "awaiting approval" number
        setPendingSubmittedCounts(submittedCounts);
      }
      if (summaryRes && summaryRes.success) {
        setPendingSummaryData(summaryRes.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const loadPickupPoints = useCallback(async () => {
    try {
      const res = await fetchAllStaffPickupPoints(token);
      if (res.success && res.pickupPoints) {
        setPickupPoints(res.pickupPoints.filter((p) => p.isActive !== false));
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    loadData();
    loadPendingCounts();
    loadPickupPoints();
  }, [loadData, loadPendingCounts, loadPickupPoints]);

  // ── Load staff details ─────────────────────────────────────────────────────
  const loadStaffDetails = useCallback(
    async (id) => {
      try {
        setLoadingDetails(true);
        const res = await fetchStaffById(token, id);
        if (res.success) setStaffDetails(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetails(false);
      }
    },
    [token],
  );

  const handleCardClick = (s) => {
    setSelectedStaff(s);
    setDetailTab(0);
    setStaffDetails(null);
    loadStaffDetails(s._id);
  };

  const handleStaffPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStaff) return;
    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          await updateStaffPhoto(token, selectedStaff._id, reader.result);
          // Refresh staff details to show new photo
          loadStaffDetails(selectedStaff._id);
          loadData();
        } catch (err) {
          alert(err.message || "Failed to update photo.");
        } finally {
          setPhotoUploading(false);
        }
      };
    } catch {
      setPhotoUploading(false);
    }
    // Reset the input so the same file can be re-selected
    e.target.value = "";
  };

  // ── Filter staff ───────────────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    return staff
      .filter((s) => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          (s.department || "").toLowerCase().includes(q) ||
          (s.schoolOrCollege || "").toLowerCase().includes(q) ||
          s.mobile.includes(q) ||
          (s.pickupPoint?.label || s.pickupPoint || "")
            .toLowerCase()
            .includes(q);

        let matchStatus = false;
        if (statusFilter === "all") {
          matchStatus = s.serviceStatus !== "deactivated";
        } else if (statusFilter === "pending_approval") {
          matchStatus = pendingScreenshots.has(s._id?.toString());
        } else {
          matchStatus = s.serviceStatus === statusFilter;
        }

        const pc =
          s.serviceStatus === "deactivated"
            ? 0
            : pendingCounts[s._id?.toString()] || 0;
        let matchPending = true;
        if (pendingFilter !== "all") {
          if (pendingFilter === "none") {
            matchPending = pc === 0;
          } else if (pendingFilter === "screenshot") {
            matchPending = pendingScreenshots.has(s._id?.toString());
          } else {
            matchPending = pc === parseInt(pendingFilter);
          }
        }

        return matchSearch && matchStatus && matchPending;
      })
      .sort((a, b) => {
        const sumA = pendingSummaryData.find((p) => String(p.staffId) === String(a._id))?.totalPending || 0;
        const sumB = pendingSummaryData.find((p) => String(p.staffId) === String(b._id))?.totalPending || 0;
        return sumB - sumA; // highest total pending amount first
      });
  }, [
    staff,
    searchTerm,
    statusFilter,
    pendingFilter,
    pendingCounts,
    pendingScreenshots,
    pendingSummaryData,
  ]);

  const handleExport = () => {
    if (!filteredStaff.length) return;
    const rows = filteredStaff.map((s) => ({
      Name: s.name,
      Mobile: s.mobile,
      "School / College": s.schoolOrCollege,
      Department: s.department || "",
      Shift: s.shift || "",
      "Pickup Point": s.pickupPoint?.label || s.pickupPoint || "",
      "Monthly Fee": s.pickupPoint?.fee || 0,
      Address: s.residentialAddress || "",
      Status: s.serviceStatus.toUpperCase(),
      "Pending Payments":
        s.serviceStatus === "deactivated" ? 0 : pendingCounts[s._id] || 0,
      "Service Start": s.serviceStartDate
        ? new Date(s.serviceStartDate).toLocaleDateString("en-IN")
        : "",
      "Service End": s.serviceEndDate
        ? new Date(s.serviceEndDate).toLocaleDateString("en-IN")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff");
    XLSX.writeFile(
      wb,
      `Staff_Export_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const handleExportPending = () => {
    if (!pendingSummaryData.length) {
      alert("No pending staff to export.");
      return;
    }
    const rows = pendingSummaryData.map((s) => ({
      Name: s.name,
      Mobile: s.mobile,
      "Pickup Point": s.pickupPoint,
      "Monthly Fee": s.monthlyFee,
      "Service Status": s.serviceStatus.toUpperCase(),
      "Pending Months": s.pendingMonths,
      "Total Pending (₹)": s.totalPending,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pending Staff");
    XLSX.writeFile(
      wb,
      `Pending_Staff_Export_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // ── Approve payment ────────────────────────────────────────────────────────
  const handleApprovePayment = async (paymentId, approveForm) => {
    try {
      await approveStaffPayment(token, paymentId, approveForm);
      if (selectedStaff) {
        loadStaffDetails(selectedStaff._id);
      }
      loadPendingCounts();
    } catch (err) {
      alert(err.message || "Approval failed");
    }
  };

  // ── Activate / Deactivate / Edit / Delete ─────────────────────────────────
  const handleAction = async () => {
    const errs = {};

    if (!editForm.name.trim()) errs.name = "Name is required.";

    if (actionModal.type === "activate" && !editForm.serviceStartDate) {
      errs.serviceStartDate = "Start date is required to activate.";
    }
    if (actionModal.type === "deactivate" && !editForm.serviceEndDate) {
      errs.serviceEndDate = "End date is required to deactivate.";
    }
    if (
      editForm.serviceStartDate &&
      editForm.serviceEndDate &&
      new Date(editForm.serviceEndDate) < new Date(editForm.serviceStartDate)
    ) {
      errs.serviceEndDate = "End date cannot be before start date.";
    }

    if (Object.keys(errs).length > 0) {
      setEditFormErrors(errs);
      return;
    }

    setEditFormErrors({});
    setEditFormServerError("");

    const proceedWithAction = async () => {
      try {
        if (actionModal.type === "activate") {
          await activateStaffService(
            token,
            actionModal.data._id,
            editForm.serviceStartDate,
          );
          await updateStaff(token, actionModal.data._id, {
            name: editForm.name,
            schoolOrCollege: editForm.schoolOrCollege,
            shift: editForm.shift,
            residentialAddress: editForm.residentialAddress,
            joiningDate: editForm.joiningDate,
            pickupPoint: editForm.pickupPoint,
          });
        } else if (actionModal.type === "deactivate") {
          await deactivateStaffService(
            token,
            actionModal.data._id,
            editForm.serviceEndDate,
          );
          await updateStaff(token, actionModal.data._id, {
            name: editForm.name,
            schoolOrCollege: editForm.schoolOrCollege,
            shift: editForm.shift,
            residentialAddress: editForm.residentialAddress,
            joiningDate: editForm.joiningDate,
            pickupPoint: editForm.pickupPoint,
          });
        } else if (actionModal.type === "edit") {
          await updateStaff(token, actionModal.data._id, editForm);
        }
        setActionModal({ type: null, data: null });
        setActionDate("");
        loadData();
        if (selectedStaff) loadStaffDetails(selectedStaff._id);
        setConfirmDialog({ ...confirmDialog, open: false });
      } catch (err) {
        setEditFormServerError(err.message || "Action failed. Please try again.");
      }
    };

    // Check if pickup point changed during an edit or activation where they can change details
    const oldPickup = actionModal.data?.pickupPoint?._id || actionModal.data?.pickupPoint;
    const newPickup = editForm.pickupPoint;
    if (oldPickup !== newPickup) {
      setConfirmDialog({
        open: true,
        title: "Change Pickup Point?",
        message: "You are changing the pickup point for this staff member. This will automatically update the required fee amount for all their PENDING payment entries to match the new pickup point's fee. Approved payments will not be affected.",
        confirmLabel: "Update & Cascade Fees",
        confirmColor: "warning",
        onConfirm: proceedWithAction
      });
    } else {
      proceedWithAction();
    }
  };

  const handleDelete = (s) => {
    setConfirmDialog({
      open: true,
      title: "Delete Staff Member",
      message: `Are you sure you want to delete ${s.name}? All their payment records will also be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete Permanently",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          await deleteStaff(token, s._id);
          setSelectedStaff(null);
          loadData();
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (err) {
          alert(err.message || "Delete failed");
        }
      }
    });
  };

  // ── Manual payment ─────────────────────────────────────────────────────────
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
    try {
      await createManualStaffPayment(token, {
        ...manualForm,
        staffId: manualForm.staffId._id,
      });
      alert("Manual payment created.");
      setManualForm({
        staffId: null,
        forMonth: "",
        forYear: new Date().getFullYear(),
        amount: "",
        utrNumber: "",
        account: "",
        adminNotes: "",
      });
      setShowManualModal(false);
      if (selectedStaff) loadStaffDetails(selectedStaff._id);
    } catch (err) {
      alert(err.message || "Manual payment failed");
    }
  };

  // ── Pending summary count ──────────────────────────────────────────────────
  // totalPending = only submitted (screenshot uploaded) payments awaiting admin approval
  const totalPending = Object.values(pendingSubmittedCounts).reduce(
    (a, b) => a + b,
    0,
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Staff Management
          </Typography>
          <Typography sx={{ color: "#64748B", fontSize: "0.875rem", mt: 0.25 }}>
            {filteredStaff.length}{" "}
            {statusFilter === "pending_approval"
              ? "awaiting screenshot approval"
              : statusFilter === "deactivated"
                ? "deactivated"
                : statusFilter === "inactive"
                  ? "inactive"
                  : statusFilter === "all"
                    ? "total"
                    : "active"}{" "}
            · {totalPending} screenshot{totalPending !== 1 ? "s" : ""} pending
            approval
          </Typography>
        </Box>

        {/* Toolbar: single row on desktop, wraps on mobile */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Status filter */}
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              width: { xs: "calc(50% - 6px)", sm: 150 },
              flexShrink: 0,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#fff",
              },
            }}
          >
            <MenuItem value="all">All Staff</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="deactivated">Deactivated</MenuItem>
            <MenuItem value="pending_approval">Pending Approval</MenuItem>
          </TextField>

          {/* Pending filter */}
          <TextField
            select
            size="small"
            label="Pending"
            value={pendingFilter}
            onChange={(e) => setPendingFilter(e.target.value)}
            sx={{
              width: { xs: "calc(50% - 6px)", sm: 170 },
              flexShrink: 0,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#fff",
              },
            }}
          >
            <MenuItem value="all">All Staff</MenuItem>
            <MenuItem value="none">No Pending</MenuItem>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <MenuItem key={n} value={String(n)}>
                {n} Pending
              </MenuItem>
            ))}
            <MenuItem value="screenshot">Screenshot Pending</MenuItem>
          </TextField>

          {/* Search — flex: 1 fills remaining space on desktop, full width on mobile */}
          <TextField
            placeholder="Search by name, school, mobile, pickup..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchOutlined
                  sx={{ color: "#94A3B8", mr: 0.5, fontSize: 20 }}
                />
              ),
            }}
            sx={{
              flex: { xs: "1 1 100%", sm: 1 },
              minWidth: { sm: 200 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: "#fff",
              },
            }}
          />

          {/* Export button */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Download Pending Staff">
              <Button
                variant="outlined"
                color="warning"
                onClick={handleExportPending}
                startIcon={<DownloadOutlined />}
                sx={{
                  bgcolor: "#fff",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  px: 1.5,
                  flexShrink: 0,
                }}
              >
                Pending
              </Button>
            </Tooltip>
            <Tooltip title="Download All Staff">
              <IconButton
                onClick={handleExport}
                sx={{
                  bgcolor: "#fff",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  p: "8px",
                  flexShrink: 0,
                  "&:hover": { bgcolor: "#F8FAFC" },
                }}
              >
                <DownloadOutlined sx={{ fontSize: 20, color: "#475569" }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Staff Grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredStaff.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ color: "#94A3B8" }}>No staff found.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredStaff.map((s) => (
            <StaffCard
              key={s._id}
              staff={s}
              pendingCount={pendingCounts[s._id] || 0}
              onClick={() => handleCardClick(s)}
            />
          ))}
        </Box>
      )}

      {/* ── Staff Detail Modal ───────────────────────────────────────────── */}
      <Dialog
        open={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}
      >
        {selectedStaff && (
          <>
            {/* Modal Header */}
            <Box
              sx={{
                bgcolor: "#1E293B",
                px: 3,
                py: 2.5,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {/* Clickable avatar — click to change photo */}
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                <Avatar
                  src={
                    staffDetails?.profileImageUrl ||
                    selectedStaff.profileImageUrl ||
                    undefined
                  }
                  sx={{
                    width: 52,
                    height: 52,
                    bgcolor: "#2563EB",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    cursor: "pointer",
                  }}
                  component="label"
                >
                  {!(
                    staffDetails?.profileImageUrl || selectedStaff.profileImageUrl
                  ) && initials(selectedStaff.name)}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleStaffPhotoChange}
                  />
                </Avatar>
                {/* Camera overlay */}
                <Box
                  component="label"
                  sx={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "#2563EB",
                    border: "2px solid #1E293B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {photoUploading ? (
                    <CircularProgress size={10} sx={{ color: "#fff" }} />
                  ) : (
                    <CameraAltOutlined sx={{ fontSize: 11, color: "#fff" }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleStaffPhotoChange}
                  />
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}
                >
                  {selectedStaff.name}
                </Typography>
                <Typography sx={{ color: "#94A3B8", fontSize: "0.82rem" }}>
                  {selectedStaff.department || selectedStaff.schoolOrCollege} ·{" "}
                  {selectedStaff.mobile}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    sx={{ color: "#94A3B8", "&:hover": { color: "#fff" } }}
                    onClick={() => {
                      const s = selectedStaff;
                      setEditForm({
                        name: s.name || "",
                        schoolOrCollege: s.schoolOrCollege || "",
                        shift: s.shift || "",
                        residentialAddress: s.residentialAddress || "",
                        joiningDate: s.joiningDate
                          ? new Date(s.joiningDate).toISOString().slice(0, 10)
                          : "",
                        pickupPoint: s.pickupPoint?._id || s.pickupPoint || "",
                        serviceStartDate: s.serviceStartDate
                          ? new Date(s.serviceStartDate)
                              .toISOString()
                              .slice(0, 10)
                          : "",
                        serviceEndDate: s.serviceEndDate
                          ? new Date(s.serviceEndDate)
                              .toISOString()
                              .slice(0, 10)
                          : "",
                      });
                      setActionModal({ type: "edit", data: selectedStaff });
                    }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    sx={{ color: "#94A3B8", "&:hover": { color: "#EF4444" } }}
                    onClick={() => handleDelete(selectedStaff)}
                  >
                    <DeleteOutlineOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <IconButton
                  size="small"
                  sx={{ color: "#94A3B8", "&:hover": { color: "#fff" } }}
                  onClick={() => setSelectedStaff(null)}
                >
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
              <Tabs
                value={detailTab}
                onChange={(_, v) => setDetailTab(v)}
                sx={{ px: 2 }}
              >
                <Tab
                  icon={<PersonOutlined fontSize="small" />}
                  iconPosition="start"
                  label="Profile"
                  sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
                />
                <Tab
                  icon={
                    <Badge
                      badgeContent={
                        selectedStaff.serviceStatus === "deactivated"
                          ? 0
                          : pendingCounts[selectedStaff._id] || 0
                      }
                      color="warning"
                      max={9}
                    >
                      <ReceiptLongOutlined fontSize="small" />
                    </Badge>
                  }
                  iconPosition="start"
                  label="Payments"
                  sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
                />
              </Tabs>
            </Box>

            <DialogContent
              sx={{
                p: 0,
                bgcolor: "#F8FAFC",
                maxHeight: "65vh",
                overflowY: "auto",
              }}
            >
              {loadingDetails ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : !staffDetails ? null : (
                <>
                  {/* ── Profile Tab ─────────────────────────────────────── */}
                  {detailTab === 0 && (
                    <Box
                      sx={{
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                      }}
                    >
                      {/* Info Grid */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 2,
                        }}
                      >
                        {[
                          { label: "Full Name", value: staffDetails.name },
                          {
                            label: "Department",
                            value:
                              staffDetails.department ||
                              staffDetails.schoolOrCollege,
                          },
                          { label: "Mobile", value: staffDetails.mobile },
                          { label: "Shift", value: staffDetails.shift },
                          {
                            label: "Pickup Point",
                            value:
                              staffDetails.pickupPoint?.label ||
                              staffDetails.pickupPoint,
                          },
                          {
                            label: "Monthly Fee",
                            value: `₹${staffDetails.pickupPoint?.fee || 0}`,
                          },
                          {
                            label: "Address",
                            value: staffDetails.residentialAddress,
                          },
                          {
                            label: "Joining Date",
                            value: staffDetails.joiningDate
                              ? new Date(
                                  staffDetails.joiningDate,
                                ).toLocaleDateString("en-IN")
                              : "—",
                          },
                          {
                            label: "Service Start",
                            value: staffDetails.serviceStartDate
                              ? new Date(
                                  staffDetails.serviceStartDate,
                                ).toLocaleDateString("en-IN")
                              : "—",
                          },
                          staffDetails.serviceEndDate && {
                            label: "Service End",
                            value: new Date(
                              staffDetails.serviceEndDate,
                            ).toLocaleDateString("en-IN"),
                          },
                        ]
                          .filter(Boolean)
                          .map(({ label, value }) => (
                            <Box
                              key={label}
                              sx={{
                                bgcolor: "#fff",
                                p: 2,
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                              }}
                            >
                              <Typography
                                sx={{
                                  color: "#64748B",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  mb: 0.25,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {label}
                              </Typography>
                              <Typography
                                sx={{
                                  color: "#0F172A",
                                  fontWeight: 600,
                                  fontSize: "0.9rem",
                                }}
                              >
                                {value || "—"}
                              </Typography>
                            </Box>
                          ))}
                      </Box>

                      {/* Service toggle */}
                      <Box
                        sx={{
                          bgcolor: "#fff",
                          p: 2.5,
                          borderRadius: "12px",
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{ fontWeight: 700, color: "#0F172A", mb: 0.5 }}
                          >
                            Service Status
                          </Typography>
                          <Chip
                            label={staffDetails.serviceStatus.toUpperCase()}
                            color={getStatusColor(staffDetails.serviceStatus)}
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>
                        {staffDetails.serviceStatus !== "active" ? (
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<PlayArrowOutlined />}
                            onClick={() => {
                              setEditForm({
                                name: staffDetails.name || "",
                                schoolOrCollege:
                                  staffDetails.schoolOrCollege || "",
                                shift: staffDetails.shift || "",
                                residentialAddress:
                                  staffDetails.residentialAddress || "",
                                joiningDate: staffDetails.joiningDate
                                  ? new Date(staffDetails.joiningDate)
                                      .toISOString()
                                      .slice(0, 10)
                                  : "",
                                pickupPoint:
                                  staffDetails.pickupPoint?._id ||
                                  staffDetails.pickupPoint ||
                                  "",
                                serviceStartDate: staffDetails.serviceStartDate
                                  ? new Date(staffDetails.serviceStartDate)
                                      .toISOString()
                                      .slice(0, 10)
                                  : "",
                                serviceEndDate: "",
                              });
                              setActionModal({
                                type: "activate",
                                data: staffDetails,
                              });
                            }}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              borderRadius: "10px",
                            }}
                          >
                            Activate Service
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={<StopCircleOutlined />}
                            onClick={() => {
                              setEditForm({
                                name: staffDetails.name || "",
                                schoolOrCollege:
                                  staffDetails.schoolOrCollege || "",
                                shift: staffDetails.shift || "",
                                residentialAddress:
                                  staffDetails.residentialAddress || "",
                                joiningDate: staffDetails.joiningDate
                                  ? new Date(staffDetails.joiningDate)
                                      .toISOString()
                                      .slice(0, 10)
                                  : "",
                                pickupPoint:
                                  staffDetails.pickupPoint?._id ||
                                  staffDetails.pickupPoint ||
                                  "",
                                serviceStartDate: staffDetails.serviceStartDate
                                  ? new Date(staffDetails.serviceStartDate)
                                      .toISOString()
                                      .slice(0, 10)
                                  : "",
                                serviceEndDate: staffDetails.serviceEndDate
                                  ? new Date(staffDetails.serviceEndDate)
                                      .toISOString()
                                      .slice(0, 10)
                                  : "",
                              });
                              setActionModal({
                                type: "deactivate",
                                data: staffDetails,
                              });
                            }}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              borderRadius: "10px",
                            }}
                          >
                            Deactivate Service
                          </Button>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* ── Payments Tab ─────────────────────────────────────── */}
                  {detailTab === 1 && (
                    <Box sx={{ p: 3 }}>
                      {/* Quick add manual payment for THIS staff */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, color: "#0F172A" }}>
                          Payment History ({staffDetails.payments?.length || 0})
                        </Typography>
                      </Box>

                      {!staffDetails.payments ||
                      staffDetails.payments.length === 0 ? (
                        <Box
                          sx={{
                            textAlign: "center",
                            py: 5,
                            border: "1px dashed #CBD5E1",
                            borderRadius: "12px",
                          }}
                        >
                          <Typography sx={{ color: "#94A3B8" }}>
                            No payments recorded yet.
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          {[...staffDetails.payments]
                            .sort(
                              (a, b) =>
                                b.forYear - a.forYear ||
                                b.forMonth - a.forMonth,
                            )
                            .map((p) => (
                              <PaymentRow
                                key={p._id}
                                payment={p}
                                onApprove={handleApprovePayment}
                                token={token}
                                onRefresh={() => {
                                  // Reload staff details to reflect updated amounts
                                  if (selectedStaff) {
                                    fetchStaffById(token, selectedStaff._id).then((res) => {
                                      if (res.success) setStaffDetails(res.data);
                                    });
                                  }
                                }}
                                onManualEntry={() => {
                                  setManualForm((prev) => ({
                                    ...prev,
                                    staffId: staffDetails,
                                    amount:
                                      p.amount || staffDetails.pickupPoint?.fee,
                                    forMonth: p.forMonth,
                                    forYear: p.forYear,
                                  }));
                                  setShowManualModal(true);
                                }}
                              />
                            ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* ── Activate / Deactivate / Edit Modal ──────────────────────────── */}
      <Dialog
        open={!!actionModal.type && actionModal.type !== "delete"}
        onClose={() => setActionModal({ type: null, data: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px" } }}
      >
        {/* Colored header */}
        <Box
          sx={{
            p: 3,
            pb: 2,
            background:
              actionModal.type === "activate"
                ? "linear-gradient(135deg, #10B981, #059669)"
                : actionModal.type === "deactivate"
                  ? "linear-gradient(135deg, #EF4444, #DC2626)"
                  : "linear-gradient(135deg, #2563EB, #1D4ED8)",
            borderRadius: "10px 10px 0 0",
          }}
        >
          <Typography
            sx={{ fontWeight: 800, color: "#fff", fontSize: "1.1rem" }}
          >
            {actionModal.type === "activate"
              ? "✅ Activate Service"
              : actionModal.type === "deactivate"
                ? "🛑 Deactivate Service"
                : "✏️ Edit Staff"}
          </Typography>
          {actionModal.data && (
            <Typography
              sx={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.82rem",
                mt: 0.3,
              }}
            >
              {actionModal.data.name} · {actionModal.data.mobile}
            </Typography>
          )}
        </Box>

        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Personal fields — always visible */}
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#94A3B8",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Personal Info
            </Typography>

            <TextField
              label="Full Name"
              fullWidth
              size="small"
              value={editForm.name}
              error={!!editFormErrors.name}
              helperText={editFormErrors.name || ""}
              onChange={(e) => {
                setEditForm((p) => ({ ...p, name: e.target.value }));
                setEditFormErrors((p) => ({ ...p, name: "" }));
              }}
            />
            <TextField
              label="School / College"
              fullWidth
              size="small"
              value={editForm.schoolOrCollege}
              onChange={(e) => {
                setEditForm((p) => ({ ...p, schoolOrCollege: e.target.value }));
                setEditFormErrors((p) => ({ ...p, schoolOrCollege: "" }));
              }}
            />
            <TextField
              label="Residential Address"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={editForm.residentialAddress}
              onChange={(e) => {
                setEditForm((p) => ({
                  ...p,
                  residentialAddress: e.target.value,
                }));
                setEditFormErrors((p) => ({ ...p, residentialAddress: "" }));
              }}
            />
            <TextField
              type="date"
              label="Joining Date *"
              fullWidth
              size="small"
              value={editForm.joiningDate}
              error={!!editFormErrors.joiningDate}
              helperText={editFormErrors.joiningDate || ""}
              onChange={(e) => {
                setEditForm((p) => ({ ...p, joiningDate: e.target.value }));
                setEditFormErrors((p) => ({ ...p, joiningDate: "" }));
              }}
              InputLabelProps={{ shrink: true }}
            />

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

            <TextField
              select
              label="Shift Time"
              fullWidth
              size="small"
              value={editForm.shift}
              onChange={(e) => {
                setEditForm((p) => ({ ...p, shift: e.target.value }));
                setEditFormErrors((p) => ({ ...p, shift: "" }));
              }}
            >
              <MenuItem value="07:30">07:30 AM</MenuItem>
              <MenuItem value="09:30">09:30 AM</MenuItem>
            </TextField>

            <Autocomplete
              options={pickupPoints}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.label
              }
              isOptionEqualToValue={(option, value) =>
                typeof value === "string"
                  ? option._id === value
                  : option._id === value._id
              }
              value={
                pickupPoints.find(
                  (p) =>
                    p._id === editForm.pickupPoint ||
                    p.label === editForm.pickupPoint,
                ) || null
              }
              onChange={(_, newValue) =>
                setEditForm((prev) => ({
                  ...prev,
                  pickupPoint: newValue ? newValue._id : "",
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pickup Point"
                  size="small"
                  fullWidth
                />
              )}
            />

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
              Service Dates
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <InputLabel>Service Start Date</InputLabel>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={editForm.serviceStartDate}
                error={!!editFormErrors.serviceStartDate}
                helperText={
                  editFormErrors.serviceStartDate ||
                  (actionModal.type === "activate"
                    ? "Required to activate"
                    : "")
                }
                onChange={(e) => {
                  setEditForm((p) => ({
                    ...p,
                    serviceStartDate: e.target.value,
                  }));
                  setEditFormErrors((p) => ({
                    ...p,
                    serviceStartDate: "",
                    serviceEndDate: "",
                  }));
                }}
                InputLabelProps={{ shrink: true }}
              />
              <InputLabel>Service End Date</InputLabel>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={editForm.serviceEndDate}
                error={!!editFormErrors.serviceEndDate}
                helperText={
                  editFormErrors.serviceEndDate ||
                  (actionModal.type === "deactivate"
                    ? "Required to deactivate"
                    : "")
                }
                onChange={(e) => {
                  setEditForm((p) => ({
                    ...p,
                    serviceEndDate: e.target.value,
                  }));
                  setEditFormErrors((p) => ({ ...p, serviceEndDate: "" }));
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: editForm.serviceStartDate || undefined }}
              />
            </Box>

            {/* Server error */}
            {editFormServerError && (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "10px",
                }}
              >
                <Typography
                  sx={{
                    color: "#EF4444",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                  }}
                >
                  {editFormServerError}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setActionModal({ type: null, data: null })}
            sx={{ textTransform: "none", color: "#64748B" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAction}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "10px",
              background:
                actionModal.type === "activate"
                  ? "linear-gradient(135deg, #10B981, #059669)"
                  : actionModal.type === "deactivate"
                    ? "linear-gradient(135deg, #EF4444, #DC2626)"
                    : "linear-gradient(135deg, #2563EB, #1D4ED8)",
              "&:hover": {
                opacity: 0.9,
              },
            }}
          >
            {actionModal.type === "activate"
              ? "Activate & Save"
              : actionModal.type === "deactivate"
                ? "Deactivate & Save"
                : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Manual Payment Modal ─────────────────────────────────────────── */}
      <Dialog
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Manual Payment Entry</DialogTitle>
        <DialogContent>
          <Box
            sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <Autocomplete
              options={staff}
              getOptionLabel={(option) => `${option.name} (${option.mobile})`}
              value={manualForm.staffId}
              onChange={(_, newValue) =>
                setManualForm((prev) => ({
                  ...prev,
                  staffId: newValue,
                  amount: newValue ? newValue.pickupPoint?.fee || "" : "",
                }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Select Staff *" />
              )}
              isOptionEqualToValue={(o, v) => o._id === v._id}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                select
                label="Month *"
                fullWidth
                disabled
                value={manualForm.forMonth}
                onChange={(e) =>
                  setManualForm((prev) => ({
                    ...prev,
                    forMonth: e.target.value,
                  }))
                }
              >
                {FULL_MONTH_NAMES.slice(1).map((m, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Year *"
                fullWidth
                type="tel"
                disabled
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button
            onClick={() => setShowManualModal(false)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddCardOutlined />}
            onClick={handleManualSubmit}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Beautiful Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden"
          }
        }}
      >
        <Box sx={{ p: 3, textAlign: "center", bgcolor: "#fff" }}>
          {confirmDialog.confirmColor === "error" ? (
            <Avatar sx={{ width: 64, height: 64, bgcolor: "#FEF2F2", color: "#EF4444", mx: "auto", mb: 2 }}>
              <DeleteOutlineOutlined sx={{ fontSize: 32 }} />
            </Avatar>
          ) : confirmDialog.confirmColor === "warning" ? (
            <Avatar sx={{ width: 64, height: 64, bgcolor: "#FFFBEB", color: "#F59E0B", mx: "auto", mb: 2 }}>
              <WarningAmberOutlined sx={{ fontSize: 32 }} />
            </Avatar>
          ) : (
            <Avatar sx={{ width: 64, height: 64, bgcolor: "#EFF6FF", color: "#3B82F6", mx: "auto", mb: 2 }}>
              <SwapHorizOutlined sx={{ fontSize: 32 }} />
            </Avatar>
          )}
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", mb: 1, px: 2 }}>
            {confirmDialog.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", lineHeight: 1.6, px: 1, mb: 3 }}>
            {confirmDialog.message}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              sx={{
                flex: 1,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "10px",
                color: "#64748B",
                borderColor: "#E2E8F0",
                "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color={confirmDialog.confirmColor}
              onClick={confirmDialog.onConfirm}
              sx={{
                flex: 1,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "10px",
                boxShadow: "none",
                "&:hover": { boxShadow: "none" }
              }}
            >
              {confirmDialog.confirmLabel}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
