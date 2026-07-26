import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Typography,
  Tooltip,
  Fade,
  Autocomplete,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  AddRounded,
  DeleteTwoTone,
  EditTwoTone,
  BuildTwoTone,
  CalendarTodayTwoTone,
  CloseTwoTone,
  SpeedTwoTone,
  DirectionsBusTwoTone,
  CheckCircleTwoTone,
  WarningAmberTwoTone,
  ErrorTwoTone,
  CurrencyRupeeTwoTone,
  NotesRounded,
  LoopTwoTone,
  PrintTwoTone,
  PrintDisabledTwoTone,
} from "@mui/icons-material";
import { useAuth } from "../../admin/context/AuthContext";
import {
  fetchAllBuses,
  fetchBusMaintenance,
  addBusMaintenance,
  deleteBusMaintenance,
  updateBusMaintenance,
  fetchFuelAnalytics,
} from "../../../api/admin/api";

// ── Predefined maintenance type suggestions ────────────────────
const MAINTENANCE_SUGGESTIONS = [
  "Engine Oil Change",
  "Steering Oil Change",
  "Coolant Top-up",
  "Brake Pads Replacement",
  "Tyre Change",
  "Air Filter Change",
  "Fuel Filter Change",
  "General Service",
  "Battery Check / Replacement",
  "Gear Oil Change",
  "Differential Oil Change",
  "AC Service",
  "Clutch Plate Replacement",
];

// ── Compute maintenance status vs latest odometer ─────────────
const getMaintenanceStatus = (record, latestOdometer) => {
  if (!record.nextDueOdometer || !latestOdometer)
    return {
      label: "No Due Set",
      color: "#475569",
      bg: "#F1F5F9",
      border: "#E2E8F0",
      Icon: null,
    };
  const diff = record.nextDueOdometer - latestOdometer;
  if (diff <= 0)
    return {
      label: "Overdue",
      color: "#991B1B",
      bg: "#FEE2E2",
      border: "#FECACA",
      Icon: ErrorTwoTone,
      iconColor: "#EF4444",
    };
  if (diff <= 1000)
    return {
      label: `Due in ${diff.toLocaleString("en-IN")} km`,
      color: "#854D0E",
      bg: "#FEF9C3",
      border: "#FDE68A",
      Icon: WarningAmberTwoTone,
      iconColor: "#EAB308",
    };
  return {
    label: `OK · ${diff.toLocaleString("en-IN")} km left`,
    color: "#166534",
    bg: "#DCFCE7",
    border: "#BBF7D0",
    Icon: CheckCircleTwoTone,
    iconColor: "#22C55E",
  };
};

export default function BusMaintenancePage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [records, setRecords] = useState([]);
  const [busesLoading, setBusesLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Latest odometer from fuel analytics
  const [latestOdometer, setLatestOdometer] = useState(null);

  // Add maintenance dialog
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    maintenanceType: "",
    datePerformed: "",
    odometerAtMaintenance: "",
    intervalKm: "",
    cost: "",
    notes: "",
    hasHardCopy: false,
  });

  // Edit state
  const [editingId, setEditingId] = useState(null);

  // No photo state needed

  // ── Load buses ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAllBuses(token);
        setBuses(res.buses || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusesLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  // ── Load records + latest odometer when bus changes ──
  const loadRecords = useCallback(async () => {
    if (!selectedBus) {
      setRecords([]);
      setLatestOdometer(null);
      return;
    }
    setRecordsLoading(true);
    setError("");
    try {
      const [mainRes, analyticsRes] = await Promise.all([
        fetchBusMaintenance(token, selectedBus._id),
        fetchFuelAnalytics(token),
      ]);
      setRecords(mainRes.records || []);

      // Find latest odometer for this bus
      const busStats = analyticsRes.analytics?.busStats || [];
      const stat = busStats.find(
        (s) => s.busId === selectedBus._id || s._id === selectedBus._id,
      );
      setLatestOdometer(stat?.latestOdometer || stat?.currentOdometer || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecordsLoading(false);
    }
  }, [token, selectedBus]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Auto-clear alerts
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ── Auto-calculated next due odometer ──
  const computedNextDue =
    formData.odometerAtMaintenance && formData.intervalKm
      ? Number(formData.odometerAtMaintenance) + Number(formData.intervalKm)
      : null;

  // ── Submit (create or update) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.maintenanceType) {
      setError("Maintenance type is required.");
      return;
    }
    if (!formData.datePerformed) {
      setError("Date is required.");
      return;
    }
    if (!formData.odometerAtMaintenance) {
      setError("Current odometer is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        maintenanceType: formData.maintenanceType,
        datePerformed: formData.datePerformed,
        odometerAtMaintenance: Number(formData.odometerAtMaintenance),
        intervalKm: formData.intervalKm
          ? Number(formData.intervalKm)
          : undefined,
        nextDueOdometer: computedNextDue || undefined,
        cost: formData.cost ? Number(formData.cost) : undefined,
        notes: formData.notes || undefined,
        hasHardCopy: formData.hasHardCopy,
      };

      if (editingId) {
        await updateBusMaintenance(token, editingId, payload);
        setSuccess("Maintenance record updated successfully!");
      } else {
        await addBusMaintenance(token, {
          ...payload,
          busId: selectedBus._id,
        });
        setSuccess("Maintenance record added successfully!");
      }
      setAddOpen(false);
      setEditingId(null);
      resetForm();
      loadRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open edit dialog with existing record data ──
  const handleOpenEdit = (rec) => {
    setEditingId(rec._id);
    setFormData({
      maintenanceType: rec.maintenanceType || "",
      datePerformed: rec.datePerformed
        ? new Date(rec.datePerformed).toISOString().slice(0, 10)
        : "",
      odometerAtMaintenance: rec.odometerAtMaintenance?.toString() || "",
      intervalKm: rec.intervalKm?.toString() || "",
      cost: rec.cost?.toString() || "",
      notes: rec.notes || "",
      hasHardCopy: !!rec.hasHardCopy,
    });
    setAddOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      maintenanceType: "",
      datePerformed: "",
      odometerAtMaintenance: "",
      intervalKm: "",
      cost: "",
      notes: "",
      hasHardCopy: false,
    });
  };

  const handleCloseAdd = () => {
    setAddOpen(false);
    resetForm();
  };

  // ── Delete record ──
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this maintenance record?")) return;
    setError("");
    try {
      await deleteBusMaintenance(token, id);
      setSuccess("Record deleted.");
      loadRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  // Count overdues and due-soon
  const overdueCount = records.filter((r) => {
    if (!r.nextDueOdometer || !latestOdometer) return false;
    return latestOdometer >= r.nextDueOdometer;
  }).length;
  const dueSoonCount = records.filter((r) => {
    if (!r.nextDueOdometer || !latestOdometer) return false;
    const diff = r.nextDueOdometer - latestOdometer;
    return diff > 0 && diff <= 1000;
  }).length;

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── Page Header ── */}
      <Box
        sx={{
          mb: 5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0891B2 0%, #0E7490 100%)",
                color: "white",
                display: "flex",
                boxShadow: "0 4px 12px rgba(8, 145, 178, 0.25)",
              }}
            >
              <BuildTwoTone />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 850,
                color: "#1E293B",
                letterSpacing: "-0.02em",
              }}
            >
              Bus Maintenance
            </Typography>
            {records.length > 0 && (
              <Chip
                label={records.length}
                size="small"
                sx={{
                  bgcolor: "#ECFEFF",
                  color: "#0891B2",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                  height: "24px",
                  px: 0.5,
                }}
              />
            )}
          </Box>
          <Typography sx={{ color: "#64748B", fontSize: "0.95rem", ml: 6 }}>
            Track engine oil, tyre changes, and all service history with
            odometer alerts.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setAddOpen(true)}
          disabled={!selectedBus}
          sx={{
            background: "linear-gradient(135deg, #0891B2 0%, #0E7490 100%)",
            color: "white",
            textTransform: "none",
            borderRadius: "12px",
            px: 3,
            py: 1.2,
            fontWeight: 700,
            fontSize: "0.95rem",
            boxShadow: "0 10px 15px -3px rgba(14, 116, 144, 0.2)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 20px 25px -5px rgba(14,116,144,0.3)",
            },
            "&:disabled": {
              background: "#E2E8F0",
              color: "#94A3B8",
              boxShadow: "none",
              transform: "none",
            },
          }}
        >
          Log Maintenance
        </Button>
      </Box>

      {/* ── Alerts ── */}
      <Fade in={!!error || !!success}>
        <Box sx={{ mb: 3 }}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError("")}
              sx={{ borderRadius: "12px" }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              onClose={() => setSuccess("")}
              sx={{ borderRadius: "12px" }}
            >
              {success}
            </Alert>
          )}
        </Box>
      </Fade>

      {/* ── Bus Selector ── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: "20px",
          border: "1px solid #F1F5F9",
          bgcolor: "#F8FDFE",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            color: "#1E293B",
            mb: 1.5,
            fontSize: "0.9rem",
          }}
        >
          Select Bus
        </Typography>
        {busesLoading ? (
          <CircularProgress size={24} sx={{ color: "#0891B2" }} />
        ) : (
          <Autocomplete
            options={buses}
            value={selectedBus}
            onChange={(_, v) => setSelectedBus(v)}
            getOptionLabel={(b) => `${b.modelName} — ${b.numberPlate}`}
            isOptionEqualToValue={(a, b) => a._id === b._id}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by model or plate number…"
                slotProps={{
                  ...params.slotProps,
                  input: {
                    ...params.slotProps?.input,
                    startAdornment: (
                      <>
                        <DirectionsBusTwoTone
                          sx={{ fontSize: 20, color: "#94A3B8", mr: 1 }}
                        />
                        {params.slotProps?.input?.startAdornment}
                      </>
                    ),
                    sx: { borderRadius: "12px", bgcolor: "white" },
                  },
                }}
              />
            )}
            sx={{ maxWidth: 480 }}
          />
        )}

        {/* Summary badges + latest odometer */}
        {selectedBus && (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              mt: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Chip
              size="small"
              label={`${records.length} Records`}
              sx={{
                bgcolor: "#ECFEFF",
                color: "#0891B2",
                fontWeight: 700,
                borderRadius: "8px",
              }}
            />
            {latestOdometer && (
              <Chip
                size="small"
                icon={<SpeedTwoTone sx={{ fontSize: "14px !important" }} />}
                label={`Current: ${latestOdometer.toLocaleString("en-IN")} km`}
                sx={{
                  bgcolor: "#F1F5F9",
                  color: "#475569",
                  fontWeight: 700,
                  borderRadius: "8px",
                }}
              />
            )}
            {overdueCount > 0 && (
              <Chip
                size="small"
                icon={<ErrorTwoTone sx={{ fontSize: "14px !important" }} />}
                label={`${overdueCount} Overdue`}
                sx={{
                  bgcolor: "#FEE2E2",
                  color: "#991B1B",
                  fontWeight: 700,
                  borderRadius: "8px",
                }}
              />
            )}
            {dueSoonCount > 0 && (
              <Chip
                size="small"
                icon={
                  <WarningAmberTwoTone sx={{ fontSize: "14px !important" }} />
                }
                label={`${dueSoonCount} Due Soon`}
                sx={{
                  bgcolor: "#FEF9C3",
                  color: "#854D0E",
                  fontWeight: 700,
                  borderRadius: "8px",
                }}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* ── Alert Banner for overdue ── */}
      {selectedBus && (overdueCount > 0 || dueSoonCount > 0) && (
        <Fade in>
          <Alert
            severity={overdueCount > 0 ? "error" : "warning"}
            icon={overdueCount > 0 ? <ErrorTwoTone /> : <WarningAmberTwoTone />}
            sx={{
              mb: 3,
              borderRadius: "16px",
              fontWeight: 600,
              "& .MuiAlert-message": { fontWeight: 600 },
            }}
          >
            {overdueCount > 0
              ? `⚠️ ${overdueCount} maintenance item${overdueCount > 1 ? "s are" : " is"} overdue for ${selectedBus.modelName}. Please service the bus immediately.`
              : `🔔 ${dueSoonCount} maintenance item${dueSoonCount > 1 ? "s are" : " is"} due within 1,000 km for ${selectedBus.modelName}.`}
          </Alert>
        </Fade>
      )}

      {/* ── Content Area ── */}
      {!selectedBus ? (
        <Box
          sx={{
            p: 10,
            textAlign: "center",
            bgcolor: "#F8FAFC",
            borderRadius: "32px",
            border: "2px dashed #E2E8F0",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              p: 3,
              borderRadius: "24px",
              bgcolor: "white",
              color: "#CBD5E1",
              mb: 3,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          >
            <DirectionsBusTwoTone sx={{ fontSize: 64 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#475569", mb: 1 }}
          >
            Select a Bus to View Maintenance
          </Typography>
          <Typography sx={{ color: "#94A3B8" }}>
            Choose a bus from the dropdown above to view and log maintenance
            records.
          </Typography>
        </Box>
      ) : recordsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={48} thickness={5} sx={{ color: "#0891B2" }} />
        </Box>
      ) : records.length === 0 ? (
        <Box
          sx={{
            p: 10,
            textAlign: "center",
            bgcolor: "#F8FAFC",
            borderRadius: "32px",
            border: "2px dashed #E2E8F0",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              p: 3,
              borderRadius: "24px",
              bgcolor: "white",
              color: "#CBD5E1",
              mb: 3,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          >
            <BuildTwoTone sx={{ fontSize: 64 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#475569", mb: 1 }}
          >
            No Maintenance Records
          </Typography>
          <Typography sx={{ color: "#94A3B8", mb: 4 }}>
            Start logging service history for{" "}
            <strong>{selectedBus.modelName}</strong>.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddRounded />}
            onClick={() => setAddOpen(true)}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              color: "#0891B2",
              borderColor: "#0891B2",
              px: 4,
              "&:hover": { bgcolor: "#ECFEFF", borderColor: "#0E7490" },
            }}
          >
            Log First Service
          </Button>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: "20px", border: "1px solid #F1F5F9" }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                {[
                  "Date",
                  "Service Type",
                  "Odometer",
                  "Next Due",
                  "Status",
                  "Cost",
                  "Hard Copy",
                  "",
                ].map((h) => (
                  <TableCell
                    key={h}
                    align={["Cost"].includes(h) ? "right" : "left"}
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      py: 2,
                      borderBottom: "2px solid #F1F5F9",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((rec, idx) => {
                const status = getMaintenanceStatus(rec, latestOdometer);
                const StatusIcon = status.Icon;
                return (
                  <TableRow
                    key={rec._id}
                    sx={{
                      "&:hover": { bgcolor: "#F8FAFC" },
                      transition: "background 0.15s",
                      bgcolor: idx % 2 === 0 ? "white" : "#FAFBFC",
                    }}
                  >
                    {/* Date */}
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: "#334155",
                        minWidth: 110,
                      }}
                    >
                      {new Date(rec.datePerformed).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </TableCell>

                    {/* Service Type */}
                    <TableCell sx={{ minWidth: 180 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            p: 0.6,
                            borderRadius: "8px",
                            bgcolor: "#ECFEFF",
                            color: "#0891B2",
                            display: "flex",
                          }}
                        >
                          <BuildTwoTone sx={{ fontSize: 14 }} />
                        </Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "#0F172A",
                          }}
                        >
                          {rec.maintenanceType}
                        </Typography>
                      </Box>
                      {rec.notes && (
                        <Typography
                          sx={{
                            fontSize: "0.72rem",
                            color: "#94A3B8",
                            mt: 0.3,
                            fontStyle: "italic",
                          }}
                        >
                          {rec.notes.length > 60
                            ? rec.notes.slice(0, 60) + "…"
                            : rec.notes}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Odometer at service */}
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        color: "#475569",
                        minWidth: 120,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <SpeedTwoTone sx={{ fontSize: 14, color: "#94A3B8" }} />
                        {rec.odometerAtMaintenance.toLocaleString("en-IN")} km
                      </Box>
                    </TableCell>

                    {/* Next Due */}
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        color: "#475569",
                        minWidth: 130,
                      }}
                    >
                      {rec.nextDueOdometer ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <LoopTwoTone
                            sx={{ fontSize: 14, color: "#94A3B8" }}
                          />
                          {rec.nextDueOdometer.toLocaleString("en-IN")} km
                        </Box>
                      ) : (
                        <Typography
                          sx={{ color: "#CBD5E1", fontSize: "0.82rem" }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell sx={{ minWidth: 160 }}>
                      {status.Icon ? (
                        <Chip
                          size="small"
                          icon={
                            <StatusIcon
                              sx={{
                                fontSize: "13px !important",
                                color: `${status.iconColor} !important`,
                              }}
                            />
                          }
                          label={status.label}
                          sx={{
                            bgcolor: status.bg,
                            color: status.color,
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            borderRadius: "8px",
                            height: "24px",
                            border: `1px solid ${status.border}`,
                          }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label={status.label}
                          sx={{
                            bgcolor: status.bg,
                            color: status.color,
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            borderRadius: "8px",
                            height: "24px",
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Cost */}
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        minWidth: 90,
                      }}
                    >
                      {rec.cost ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.3,
                            justifyContent: "flex-end",
                          }}
                        >
                          <CurrencyRupeeTwoTone
                            sx={{ fontSize: 14, color: "#94A3B8" }}
                          />
                          {rec.cost.toLocaleString("en-IN")}
                        </Box>
                      ) : (
                        <Typography
                          sx={{ color: "#CBD5E1", fontSize: "0.82rem" }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Hard Copy */}
                    <TableCell sx={{ minWidth: 90 }}>
                      <Chip
                        size="small"
                        icon={
                          rec.hasHardCopy
                            ? <PrintTwoTone sx={{ fontSize: "12px !important", color: "#166534 !important" }} />
                            : <PrintDisabledTwoTone sx={{ fontSize: "12px !important", color: "#94A3B8 !important" }} />
                        }
                        label={rec.hasHardCopy ? "Hard Copy" : "Digital"}
                        sx={{
                          bgcolor: rec.hasHardCopy ? "#DCFCE7" : "#F1F5F9",
                          color: rec.hasHardCopy ? "#166534" : "#64748B",
                          fontWeight: 700,
                          fontSize: "0.68rem",
                          borderRadius: "7px",
                          height: "22px",
                        }}
                      />
                    </TableCell>

                    {/* Edit / Delete */}
                    <TableCell sx={{ minWidth: 90 }}>
                      {isAdmin && (
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit Record">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(rec)}
                              sx={{
                                color: "#3B82F6",
                                transition: "all 0.2s",
                                "&:hover": { bgcolor: "#EFF6FF" },
                              }}
                            >
                              <EditTwoTone fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Record">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(rec._id)}
                              sx={{
                                color: "#EF4444",
                                transition: "all 0.2s",
                                "&:hover": { bgcolor: "#FEF2F2" },
                              }}
                            >
                              <DeleteTwoTone fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Add Maintenance Dialog ── */}
      <Dialog
        open={addOpen}
        onClose={handleCloseAdd}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          },
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              p: 3,
              pb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0891B2 0%, #0E7490 100%)",
                color: "white",
                display: "flex",
              }}
            >
              <BuildTwoTone sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}
              >
                {editingId ? "Edit Maintenance" : "Log Maintenance"}
              </Typography>
              <Typography
                sx={{ fontSize: "0.78rem", color: "#94A3B8", fontWeight: 500 }}
              >
                {selectedBus?.modelName} — {selectedBus?.numberPlate}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseAdd} sx={{ ml: "auto" }}>
              <CloseTwoTone />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3, pt: 2.5 }}>
            <Grid container spacing={2.5}>
              {/* Maintenance Type — freeSolo autocomplete */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  freeSolo
                  options={MAINTENANCE_SUGGESTIONS}
                  value={formData.maintenanceType}
                  onInputChange={(_, v) =>
                    setFormData({ ...formData, maintenanceType: v })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      placeholder="e.g. Engine Oil Change, or type your own…"
                      slotProps={{
                        ...params.slotProps,
                        input: {
                          ...params.slotProps?.input,
                          startAdornment: (
                            <>
                              <BuildTwoTone
                                sx={{ fontSize: 18, color: "#94A3B8", mr: 1 }}
                              />
                              {params.slotProps?.input?.startAdornment}
                            </>
                          ),
                          sx: { borderRadius: "12px" },
                        },
                      }}
                    />
                  )}
                />
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: "#94A3B8",
                    mt: 0.5,
                    ml: 0.5,
                  }}
                >
                  Select from the list or type a custom service type.
                </Typography>
              </Grid>

              {/* Date Performed */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel sx={{ fontWeight: "bold" }}>
                  Date Performed *
                </InputLabel>
                <TextField
                  fullWidth
                  required
                  type="date"
                  value={formData.datePerformed}
                  onChange={(e) =>
                    setFormData({ ...formData, datePerformed: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <CalendarTodayTwoTone
                        sx={{ fontSize: 18, color: "#94A3B8", mr: 1 }}
                      />
                    ),
                  }}
                />
              </Grid>

              {/* Odometer at Maintenance */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel sx={{ fontWeight: "bold" }}>
                  Odometer at Service (km) *
                </InputLabel>
                <TextField
                  fullWidth
                  required
                  type="tel"
                  placeholder="e.g. 100000"
                  value={formData.odometerAtMaintenance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      odometerAtMaintenance: e.target.value,
                    })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <SpeedTwoTone
                        sx={{ fontSize: 18, color: "#94A3B8", mr: 1 }}
                      />
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                    }}
                  >
                    Next Service (Optional)
                  </Typography>
                </Divider>
              </Grid>

              {/* Interval km */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel sx={{ fontWeight: "bold" }}>
                  Service Interval (km)
                </InputLabel>
                <TextField
                  fullWidth
                  type="tel"
                  placeholder="e.g. 40000"
                  value={formData.intervalKm}
                  onChange={(e) =>
                    setFormData({ ...formData, intervalKm: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <LoopTwoTone
                        sx={{ fontSize: 18, color: "#94A3B8", mr: 1 }}
                      />
                    ),
                  }}
                />
              </Grid>

              {/* Auto-calculated next due */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel sx={{ fontWeight: "bold" }}>
                  Next Service (km)
                </InputLabel>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: computedNextDue ? "#ECFEFF" : "#F8FAFC",
                    border: `1.5px solid ${computedNextDue ? "#A5F3FC" : "#E2E8F0"}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minHeight: 56,
                    transition: "all 0.3s",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: computedNextDue ? "1.15rem" : "0.9rem",
                      color: computedNextDue ? "#0E7490" : "#CBD5E1",
                      transition: "all 0.3s",
                    }}
                  >
                    {computedNextDue
                      ? `${computedNextDue.toLocaleString("en-IN")} km`
                      : "— auto-calculated"}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                    }}
                  >
                    Additional Details (Optional)
                  </Typography>
                </Divider>
              </Grid>

              {/* Cost */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Cost (₹)"
                  type="tel"
                  placeholder="0"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <CurrencyRupeeTwoTone
                        sx={{ fontSize: 18, color: "#94A3B8", mr: 1 }}
                      />
                    ),
                  }}
                />
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notes / Remarks"
                  multiline
                  rows={2}
                  placeholder="Any special observations…"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
              </Grid>

              {/* Hard Copy Toggle */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "0.88rem",
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <PrintTwoTone sx={{ fontSize: 18, color: "#0891B2" }} />
                  Do you have a hard copy of the bill?
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={formData.hasHardCopy}
                  onChange={(_, v) => {
                    if (v !== null) setFormData({ ...formData, hasHardCopy: v });
                  }}
                  sx={{ gap: 1.5 }}
                >
                  <ToggleButton
                    value={true}
                    sx={{
                      borderRadius: "12px !important",
                      border: "1.5px solid #E2E8F0 !important",
                      px: 3,
                      py: 1,
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      textTransform: "none",
                      color: "#64748B",
                      transition: "all 0.2s",
                      "&.Mui-selected": {
                        bgcolor: "#DCFCE7 !important",
                        color: "#166534 !important",
                        border: "1.5px solid #86EFAC !important",
                      },
                    }}
                  >
                    <CheckCircleTwoTone sx={{ fontSize: 18, mr: 0.75 }} />
                    Yes
                  </ToggleButton>
                  <ToggleButton
                    value={false}
                    sx={{
                      borderRadius: "12px !important",
                      border: "1.5px solid #E2E8F0 !important",
                      px: 3,
                      py: 1,
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      textTransform: "none",
                      color: "#64748B",
                      transition: "all 0.2s",
                      "&.Mui-selected": {
                        bgcolor: "#F1F5F9 !important",
                        color: "#475569 !important",
                        border: "1.5px solid #CBD5E1 !important",
                      },
                    }}
                  >
                    <PrintDisabledTwoTone sx={{ fontSize: 18, mr: 0.75 }} />
                    No
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
            <Button
              onClick={handleCloseAdd}
              disabled={submitting}
              sx={{
                color: "#64748B",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "12px",
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                background: "linear-gradient(135deg, #0891B2 0%, #0E7490 100%)",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "12px",
                px: 4,
                py: 1.2,
                boxShadow: "0 4px 12px rgba(8,145,178,0.25)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
                },
              }}
            >
              {submitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "white" }} />
                  <span>Saving…</span>
                </Box>
              ) : editingId ? (
                "Update Record"
              ) : (
                "Save Record"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
}
