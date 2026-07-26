import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Divider,
  Avatar,
  InputAdornment,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
} from "@mui/material";
import {
  AddRounded,
  EditTwoTone,
  DeleteTwoTone,
  DirectionsBusTwoTone,
  GroupsTwoTone,
  SpeedTwoTone,
  LocalGasStationTwoTone,
  TrendingUpTwoTone,
  SentimentSatisfiedAltTwoTone,
  SentimentNeutralTwoTone,
  SentimentVeryDissatisfiedTwoTone,
  CloseTwoTone,
  RouteRounded,
  ShowChartTwoTone,
  CalendarTodayTwoTone,
  WaterDropTwoTone,
  CurrencyRupeeTwoTone,
  ConfirmationNumberTwoTone,
  PersonTwoTone,
  WarningAmberRounded,
  SearchOutlined,
  CloseRounded,
  DescriptionTwoTone,
  BuildTwoTone,
  CheckCircleTwoTone,
  ErrorTwoTone,
  WarningAmberTwoTone,
  LoopTwoTone,
  PrintTwoTone,
  PrintDisabledTwoTone,
  NotificationsActiveTwoTone,
  NotificationsNoneTwoTone,
  AccountBalanceOutlined,
} from "@mui/icons-material";
import { useAuth } from "../../admin/context/AuthContext";
import {
  fetchAllBuses,
  createBus,
  updateBus,
  deleteBus,
  fetchFuelAnalytics,
  fetchAllFuelEntries,
  fetchBusDocuments,
  fetchBusMaintenance,
  fetchMaintenanceAlerts,
} from "../../../api/admin/api";

const STATUS_CONFIG = {
  GOOD: { bg: "#DCFCE7", text: "#166534", label: "Efficient" },
  OKAY: { bg: "#FEF9C3", text: "#854D0E", label: "Normal" },
  ALARMING: { bg: "#FFEDD5", text: "#C2410C", label: "Warning" },
  VERY_ALARMING: { bg: "#FEE2E2", text: "#991B1B", label: "Critical" },
};

export default function BusManagementPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [buses, setBuses] = useState([]);
  const [busStats, setBusStats] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Frontend search
  const [searchQuery, setSearchQuery] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBusId, setCurrentBusId] = useState(null);

  // Bus detail dialog state
  const [detailBus, setDetailBus] = useState(null);
  const [detailEntries, setDetailEntries] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDocuments, setDetailDocuments] = useState([]);
  const [detailMaintenance, setDetailMaintenance] = useState([]);
  // Photo preview dialog

  const [formData, setFormData] = useState({
    modelName: "",
    numberPlate: "",
    seatCapacity: "",
    registrationOdometer: "",
    thresholdGood: "",
    thresholdOkay: "",
    thresholdAlarming: "",
    gstOwner: "",
    hypothecation: "",
    hypothecationBank: "",
  });

  const loadBuses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const [busesRes, analyticsRes, alertsRes] = await Promise.all([
        fetchAllBuses(token),
        fetchFuelAnalytics(token), // All-time stats
        fetchMaintenanceAlerts(token).catch(() => ({ alerts: [] })),
      ]);
      setBuses(busesRes.buses || []);
      setBusStats(analyticsRes.analytics?.busStats || []);
      setMaintenanceAlerts(alertsRes.alerts || []);
    } catch (err) {
      setError(err.message || "Failed to load buses");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBuses();
  }, [loadBuses]);

  // Get stats for a specific bus from the analytics data
  const getBusStats = (busId) => {
    return busStats.find((s) => s.busId === busId || s._id === busId) || null;
  };

  // Get maintenance alert for a specific bus
  const getBusAlert = (busId) => {
    return maintenanceAlerts.find((a) => a.busId === busId || a.busId?._id === busId) || null;
  };

  // Count total buses with alerts
  const alertSummary = useMemo(() => {
    const overdue = maintenanceAlerts.filter((a) => a.status === "overdue").length;
    const dueSoon = maintenanceAlerts.filter((a) => a.status === "due-soon").length;
    return { overdue, dueSoon, total: overdue + dueSoon };
  }, [maintenanceAlerts]);

  // Frontend-filtered list (model name OR number plate, case-insensitive)
  const q = searchQuery.trim().toLowerCase();
  const filteredBuses = useMemo(
    () =>
      q
        ? buses.filter(
            (b) =>
              b.modelName?.toLowerCase().includes(q) ||
              b.numberPlate?.toLowerCase().includes(q),
          )
        : buses,
    [buses, q],
  );

  // Open bus detail dialog
  const handleOpenDetail = async (bus) => {
    setDetailBus(bus);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailDocuments([]);
    setDetailMaintenance([]);
    try {
      const [fuelRes, docsRes, maintRes] = await Promise.all([
        fetchAllFuelEntries(token, bus._id),
        fetchBusDocuments(token, bus._id).catch(() => ({ documents: [] })),
        fetchBusMaintenance(token, bus._id).catch(() => ({ records: [] })),
      ]);
      setDetailEntries(fuelRes.fuelEntries || []);
      setDetailDocuments(docsRes.documents || []);
      setDetailMaintenance(maintRes.records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenNew = () => {
    setIsEditing(false);
    setCurrentBusId(null);
    setFormData({
      modelName: "",
      numberPlate: "",
      seatCapacity: "",
      registrationOdometer: "",
      thresholdGood: "",
      thresholdOkay: "",
      thresholdAlarming: "",
      gstOwner: "",
      hypothecation: "",
      hypothecationBank: "",
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (bus) => {
    setIsEditing(true);
    setCurrentBusId(bus._id);
    setFormData({
      modelName: bus.modelName,
      numberPlate: bus.numberPlate,
      seatCapacity: bus.seatCapacity,
      registrationOdometer: bus.registrationOdometer,
      thresholdGood: bus.thresholdGood,
      thresholdOkay: bus.thresholdOkay,
      thresholdAlarming: bus.thresholdAlarming,
      gstOwner: bus.gstOwner || "",
      hypothecation: bus.hypothecation || "",
      hypothecationBank: bus.hypothecationBank || "",
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this bus? All fuel entries will also be deleted.",
      )
    )
      return;
    try {
      await deleteBus(token, id);
      setSuccess("Bus deleted successfully");
      loadBuses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      modelName: formData.modelName,
      numberPlate: formData.numberPlate,
      seatCapacity: Number(formData.seatCapacity),
      registrationOdometer: Number(formData.registrationOdometer),
      thresholdGood: Number(formData.thresholdGood),
      thresholdOkay: Number(formData.thresholdOkay),
      thresholdAlarming: Number(formData.thresholdAlarming),
      gstOwner: formData.gstOwner,
      hypothecation: formData.hypothecation,
      hypothecationBank: formData.hypothecation === "with" ? formData.hypothecationBank : undefined,
    };

    try {
      if (isEditing) {
        await updateBus(token, currentBusId, payload);
        setSuccess("Bus updated successfully");
      } else {
        await createBus(token, payload);
        setSuccess("Bus registered successfully");
      }
      setOpenDialog(false);
      loadBuses();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Alert
          severity="error"
          variant="filled"
          sx={{ borderRadius: "12px", maxWidth: "500px", margin: "0 auto" }}
        >
          Access Denied: You do not have permission to view this page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 3,
          position: "relative",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                color: "white",
                display: "flex",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
              }}
            >
              <DirectionsBusTwoTone />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 850,
                color: "#1E293B",
                letterSpacing: "-0.02em",
              }}
            >
              Bus Management
            </Typography>
            <Chip
              label={buses.length}
              size="small"
              sx={{
                bgcolor: "#EFF6FF",
                color: "#2563EB",
                fontWeight: 800,
                fontSize: "0.85rem",
                borderRadius: "8px",
                height: "24px",
                px: 0.5,
              }}
            />
            {/* Maintenance Alert Notification Badge */}
            {alertSummary.total > 0 && (
              <Tooltip
                title={`${alertSummary.overdue} overdue, ${alertSummary.dueSoon} due soon`}
                arrow
                TransitionComponent={Fade}
              >
                <Chip
                  icon={
                    alertSummary.overdue > 0 ? (
                      <NotificationsActiveTwoTone
                        sx={{ fontSize: "16px !important", color: "#EF4444 !important" }}
                      />
                    ) : (
                      <NotificationsActiveTwoTone
                        sx={{ fontSize: "16px !important", color: "#EAB308 !important" }}
                      />
                    )
                  }
                  label={`${alertSummary.total} alert${alertSummary.total > 1 ? "s" : ""}`}
                  size="small"
                  sx={{
                    bgcolor: alertSummary.overdue > 0 ? "#FEE2E2" : "#FEF9C3",
                    color: alertSummary.overdue > 0 ? "#991B1B" : "#854D0E",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    borderRadius: "8px",
                    height: "24px",
                    animation: alertSummary.overdue > 0 ? "pulse 2s infinite" : "none",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.7 },
                    },
                  }}
                />
              </Tooltip>
            )}
          </Box>
          <Typography sx={{ color: "#64748B", fontSize: "0.95rem", ml: 6 }}>
            Manage your fleet, track efficiency, and configure performance
            thresholds.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={handleOpenNew}
          sx={{
            background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
            color: "white",
            textTransform: "none",
            borderRadius: "12px",
            px: 3,
            py: 1.2,
            fontWeight: 700,
            fontSize: "0.95rem",
            boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.15)",
            transform: "translateY(0px)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.2)",
              background: "linear-gradient(135deg, #334155 0%, #1E293B 100%)",
            },
          }}
        >
          Add New Bus
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 4,
          borderRadius: "20px",
          border: "1px solid #F1F5F9",
          bgcolor: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, maxWidth: 380 }}>
          <InputLabel sx={{ color: "#1E293B", fontWeight: 600, mb: 0.5, fontSize: "0.8rem" }}>
            Search Bus
          </InputLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by model name or number plate…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 18, color: "#94A3B8" }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery("")}
                    sx={{ color: "#94A3B8" }}
                  >
                    <CloseRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: "white",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563EB" },
              },
            }}
          />
        </Box>
        {searchQuery && (
          <Chip
            label={`${filteredBuses.length} of ${buses.length} buses`}
            size="small"
            sx={{
              bgcolor: "#EFF6FF",
              color: "#2563EB",
              fontWeight: 700,
              borderRadius: "8px",
              mt: 2.5,
            }}
          />
        )}
      </Paper>

      <Fade in={!!error || !!success}>
        <Box sx={{ mb: 4 }}>
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

      {/* Main Content */}
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "40vh",
          }}
        >
          <CircularProgress
            thickness={5}
            size={48}
            sx={{ color: "#2563EB", opacity: 0.8 }}
          />
        </Box>
      ) : filteredBuses.length === 0 ? (
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
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            {searchQuery ? (
              <SearchOutlined sx={{ fontSize: 64 }} />
            ) : (
              <DirectionsBusTwoTone sx={{ fontSize: 64 }} />
            )}
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#475569", mb: 1 }}
          >
            {searchQuery
              ? `No buses matching "${searchQuery}"`
              : "No Buses Registered"}
          </Typography>
          <Typography sx={{ color: "#94A3B8", mb: 4 }}>
            {searchQuery
              ? "Try a different name or number plate, or clear the search."
              : "Start by adding your first bus to the fleet."}
          </Typography>
          {searchQuery ? (
            <Button
              variant="outlined"
              onClick={() => setSearchQuery("")}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                px: 4,
              }}
            >
              Clear Search
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={handleOpenNew}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                px: 4,
              }}
            >
              Register Bus
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3.5}>
          {filteredBuses.map((bus, index) => {
            const stats = getBusStats(bus._id);
            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={bus._id}>
                <Fade in timeout={300 + index * 100}>
                  <Paper
                    elevation={0}
                    onClick={() => handleOpenDetail(bus)}
                    sx={{
                      borderRadius: "24px",
                      border: "1px solid #F1F5F9",
                      bgcolor: "rgba(255, 255, 255, 0.8)",
                      backdropFilter: "blur(20px)",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
                        border: "1px solid #E2E8F0",
                        transform: "translateY(-2px)",
                        "& .bus-actions": { opacity: 1 },
                      },
                    }}
                  >
                    {/* Card Header */}
                    <Box
                      sx={{
                        p: 3,
                        pb: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}
                        >
                          {bus.modelName}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
                        >
                          <Chip
                            label={bus.numberPlate}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: "#F1F5F9",
                              color: "#475569",
                              borderRadius: "6px",
                              fontSize: "0.7rem",
                              letterSpacing: "0.05em",
                            }}
                          />
                          {/* Maintenance Alert Badge on Card */}
                          {(() => {
                            const alert = getBusAlert(bus._id);
                            if (!alert || alert.status === "ok") return null;
                            const isOverdue = alert.status === "overdue";
                            return (
                              <Tooltip
                                title={
                                  isOverdue
                                    ? `${alert.overdueCount} service${alert.overdueCount > 1 ? "s" : ""} overdue — ${alert.overdue.map((o) => o.maintenanceType).join(", ")}`
                                    : `${alert.dueSoonCount} service${alert.dueSoonCount > 1 ? "s" : ""} due soon (within ${alert.dueSoon[0]?.diff?.toLocaleString("en-IN") || "1,000"} km)`
                                }
                                arrow
                              >
                                <Chip
                                  icon={
                                    isOverdue ? (
                                      <ErrorTwoTone sx={{ fontSize: "12px !important", color: "#EF4444 !important" }} />
                                    ) : (
                                      <WarningAmberTwoTone sx={{ fontSize: "12px !important", color: "#EAB308 !important" }} />
                                    )
                                  }
                                  label={
                                    isOverdue
                                      ? `${alert.overdueCount} overdue`
                                      : `${alert.dueSoonCount} due soon`
                                  }
                                  size="small"
                                  sx={{
                                    bgcolor: isOverdue ? "#FEE2E2" : "#FEF9C3",
                                    color: isOverdue ? "#991B1B" : "#854D0E",
                                    fontWeight: 700,
                                    fontSize: "0.65rem",
                                    borderRadius: "6px",
                                    height: "20px",
                                    border: `1px solid ${isOverdue ? "#FECACA" : "#FDE68A"}`,
                                    animation: isOverdue ? "cardPulse 2s infinite" : "none",
                                    "@keyframes cardPulse": {
                                      "0%, 100%": { opacity: 1 },
                                      "50%": { opacity: 0.65 },
                                    },
                                  }}
                                />
                              </Tooltip>
                            );
                          })()}

                          {/* GST Owner Chip */}
                          {bus.gstOwner && (
                            <Chip
                              label={`GST: ${bus.gstOwner}`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.62rem",
                                bgcolor: "#F5F3FF",
                                color: "#7C3AED",
                                borderRadius: "6px",
                                height: "20px",
                                border: "1px solid #DDD6FE",
                                maxWidth: "100%",
                                "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
                              }}
                            />
                          )}

                          {/* Hypothecation Chip */}
                          {bus.hypothecation && (
                            <Tooltip
                              title={
                                bus.hypothecation === "with"
                                  ? `Financed by: ${bus.hypothecationBank || "N/A"}`
                                  : "Owned outright — no loan"
                              }
                              arrow
                            >
                              <Chip
                                icon={
                                  bus.hypothecation === "with" ? (
                                    <AccountBalanceOutlined sx={{ fontSize: "11px !important", color: "#C2410C !important" }} />
                                  ) : (
                                    <CheckCircleTwoTone sx={{ fontSize: "11px !important", color: "#166534 !important" }} />
                                  )
                                }
                                label={
                                  bus.hypothecation === "with"
                                    ? "Financed"
                                    : "Owned"
                                }
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.62rem",
                                  bgcolor:
                                    bus.hypothecation === "with"
                                      ? "#FFF7ED"
                                      : "#ECFDF5",
                                  color:
                                    bus.hypothecation === "with"
                                      ? "#C2410C"
                                      : "#065F46",
                                  borderRadius: "6px",
                                  height: "20px",
                                  border: `1px solid ${
                                    bus.hypothecation === "with"
                                      ? "#FED7AA"
                                      : "#A7F3D0"
                                  }`,
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      <Box
                        className="bus-actions"
                        sx={{
                          opacity: { xs: 1, md: 0 },
                          transition: "opacity 0.3s ease",
                          display: "flex",
                          gap: 0.5,
                          bgcolor: "#F8FAFC",
                          borderRadius: "12px",
                          p: 0.5,
                          flexShrink: 0,
                        }}
                      >
                        <Tooltip title="Edit Bus">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(bus);
                            }}
                            sx={{
                              color: "#3B82F6",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                bgcolor: "#EFF6FF",
                                transform: "translateY(-2px)",
                              },
                            }}
                          >
                            <EditTwoTone fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Bus">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(bus._id);
                            }}
                            sx={{
                              color: "#EF4444",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                bgcolor: "#FEF2F2",
                                transform: "translateY(-2px)",
                              },
                            }}
                          >
                            <DeleteTwoTone fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Card Stats — Static + Live */}
                    <Box sx={{ px: 3, mb: 3 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: "16px",
                              bgcolor: "#F8FAFC",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <GroupsTwoTone
                                sx={{ fontSize: 16, color: "#94A3B8" }}
                              />
                              <Typography
                                sx={{
                                  fontSize: "0.7rem",
                                  color: "#64748B",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                Capacity
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: "1.1rem",
                                color: "#1E293B",
                              }}
                            >
                              {bus.seatCapacity}
                              <Box
                                component="span"
                                sx={{
                                  fontSize: "0.75rem",
                                  fontWeight: 500,
                                  ml: 0.5,
                                  color: "#64748B",
                                }}
                              >
                                seats
                              </Box>
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: "16px",
                              bgcolor: "#F8FAFC",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <SpeedTwoTone
                                sx={{ fontSize: 16, color: "#94A3B8" }}
                              />
                              <Typography
                                sx={{
                                  fontSize: "0.7rem",
                                  color: "#64748B",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                Starting Km
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: "1.1rem",
                                color: "#1E293B",
                              }}
                            >
                              {bus.registrationOdometer?.toLocaleString()}
                              <Box
                                component="span"
                                sx={{
                                  fontSize: "0.75rem",
                                  fontWeight: 500,
                                  ml: 0.5,
                                  color: "#64748B",
                                }}
                              >
                                km
                              </Box>
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Live Stats from Analytics */}
                        {stats && (
                          <>
                            <Grid size={{ xs: 6 }}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: "16px",
                                  bgcolor: "#EFF6FF",
                                  border: "1px solid #DBEAFE",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 0.5,
                                  }}
                                >
                                  <RouteRounded
                                    sx={{ fontSize: 16, color: "#3B82F6" }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: "0.7rem",
                                      color: "#3B82F6",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.02em",
                                    }}
                                  >
                                    Total KM
                                  </Typography>
                                </Box>
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: "1.1rem",
                                    color: "#1E40AF",
                                  }}
                                >
                                  {stats.totalKm?.toLocaleString("en-IN", {
                                    maximumFractionDigits: 0,
                                  })}
                                  <Box
                                    component="span"
                                    sx={{
                                      fontSize: "0.7rem",
                                      fontWeight: 500,
                                      ml: 0.5,
                                      color: "#3B82F6",
                                    }}
                                  >
                                    km
                                  </Box>
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: "16px",
                                  bgcolor:
                                    stats.avgKmPerLitre >= (bus.thresholdGood || 4)
                                      ? "#ECFDF5"
                                      : stats.avgKmPerLitre >= (bus.thresholdOkay || 3)
                                        ? "#FFFBEB"
                                        : "#FEF2F2",
                                  border: `1px solid ${
                                    stats.avgKmPerLitre >= (bus.thresholdGood || 4)
                                      ? "#A7F3D0"
                                      : stats.avgKmPerLitre >= (bus.thresholdOkay || 3)
                                        ? "#FDE68A"
                                        : "#FECACA"
                                  }`,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 0.5,
                                  }}
                                >
                                  <TrendingUpTwoTone
                                    sx={{
                                      fontSize: 16,
                                      color:
                                        stats.avgKmPerLitre >= (bus.thresholdGood || 4)
                                          ? "#10B981"
                                          : stats.avgKmPerLitre >= (bus.thresholdOkay || 3)
                                            ? "#F59E0B"
                                            : "#EF4444",
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: "0.7rem",
                                      color: "#64748B",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.02em",
                                    }}
                                  >
                                    Avg km/L
                                  </Typography>
                                </Box>
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: "1.1rem",
                                    color:
                                      stats.avgKmPerLitre >= (bus.thresholdGood || 4)
                                        ? "#065F46"
                                        : stats.avgKmPerLitre >= (bus.thresholdOkay || 3)
                                          ? "#92400E"
                                          : "#991B1B",
                                  }}
                                >
                                  {stats.avgKmPerLitre?.toFixed(2)}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Box>

                    {/* Thresholds Section */}
                    <Box
                      sx={{
                        p: 3,
                        pt: 2,
                        bgcolor: "#F1F5F9",
                        borderTop: "1px solid #E2E8F0",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <TrendingUpTwoTone
                          sx={{ fontSize: 18, color: "#475569" }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#475569",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        >
                          Fuel Efficiency Goals
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <SentimentSatisfiedAltTwoTone
                              sx={{ fontSize: 18, color: "#22C55E" }}
                            />
                            <Typography
                              sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                            >
                              Target Range
                            </Typography>
                          </Box>
                          <Chip
                            label={`≥ ${bus.thresholdGood} km/L`}
                            size="small"
                            sx={{
                              bgcolor: "#DCFCE7",
                              color: "#166534",
                              fontWeight: 700,
                              borderRadius: "8px",
                              height: "24px",
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <SentimentNeutralTwoTone
                              sx={{ fontSize: 18, color: "#EAB308" }}
                            />
                            <Typography
                              sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                            >
                              Acceptable Range
                            </Typography>
                          </Box>
                          <Chip
                            label={`≥ ${bus.thresholdOkay} km/L`}
                            size="small"
                            sx={{
                              bgcolor: "#FEF9C3",
                              color: "#854D0E",
                              fontWeight: 700,
                              borderRadius: "8px",
                              height: "24px",
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <SentimentVeryDissatisfiedTwoTone
                              sx={{ fontSize: 18, color: "#EF4444" }}
                            />
                            <Typography
                              sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                            >
                              Critical Alert
                            </Typography>
                          </Box>
                          <Chip
                            label={`< ${bus.thresholdAlarming} km/L`}
                            size="small"
                            sx={{
                              bgcolor: "#FEE2E2",
                              color: "#991B1B",
                              fontWeight: 700,
                              borderRadius: "8px",
                              height: "24px",
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Fade>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Bus Detail Dialog ── */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "28px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            maxHeight: "85vh",
          },
        }}
      >
        {detailBus && (
          <>
            <DialogTitle
              sx={{
                p: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                    color: "white",
                    display: "flex",
                  }}
                >
                  <DirectionsBusTwoTone sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 900, color: "#0F172A" }}
                  >
                    {detailBus.modelName}
                  </Typography>
                  <Chip
                    label={detailBus.numberPlate}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: "#F1F5F9",
                      color: "#475569",
                      borderRadius: "6px",
                      fontSize: "0.7rem",
                    }}
                  />
                </Box>
              </Box>
              <IconButton onClick={() => setDetailOpen(false)}>
                <CloseTwoTone />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              {/* Summary Stats */}
              {(() => {
                const stats = getBusStats(detailBus._id);
                if (!stats) return null;
                return (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "16px",
                          bgcolor: "#EFF6FF",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#3B82F6",
                            textTransform: "uppercase",
                          }}
                        >
                          Total KM
                        </Typography>
                        <Typography
                          sx={{ fontWeight: 900, fontSize: "1.3rem", color: "#1E40AF" }}
                        >
                          {stats.totalKm?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "16px",
                          bgcolor: "#F0FDF4",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#16A34A",
                            textTransform: "uppercase",
                          }}
                        >
                          Avg km/L
                        </Typography>
                        <Typography
                          sx={{ fontWeight: 900, fontSize: "1.3rem", color: "#166534" }}
                        >
                          {stats.avgKmPerLitre?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "16px",
                          bgcolor: "#F5F3FF",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#7C3AED",
                            textTransform: "uppercase",
                          }}
                        >
                          Total Litres
                        </Typography>
                        <Typography
                          sx={{ fontWeight: 900, fontSize: "1.3rem", color: "#5B21B6" }}
                        >
                          {stats.totalLitres?.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "16px",
                          bgcolor: "#ECFDF5",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#059669",
                            textTransform: "uppercase",
                          }}
                        >
                          Total Cost
                        </Typography>
                        <Typography
                          sx={{ fontWeight: 900, fontSize: "1.3rem", color: "#065F46" }}
                        >
                          ₹{stats.totalCost?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                );
              })()}

              {/* Fuel History */}
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <LocalGasStationTwoTone sx={{ fontSize: 18 }} />
                Fuel History ({detailEntries.length} entries)
              </Typography>

              {detailLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress size={36} sx={{ color: "#3B82F6" }} />
                </Box>
              ) : detailEntries.length === 0 ? (
                <Box
                  sx={{
                    p: 6,
                    textAlign: "center",
                    bgcolor: "#F8FAFC",
                    borderRadius: "16px",
                  }}
                >
                  <Typography sx={{ color: "#94A3B8", fontWeight: 600 }}>
                    No fuel entries recorded for this bus yet.
                  </Typography>
                </Box>
              ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    borderRadius: "16px",
                    border: "1px solid #F1F5F9",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                        <TableCell sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#475569" }}>
                          Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#475569" }}>
                          Receipt
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#475569" }}>
                          Driver
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#475569" }}
                        >
                          Litres
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#475569" }}
                        >
                          Odometer
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#475569" }}
                        >
                          KM
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#475569" }}
                        >
                          km/L
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#475569" }}
                        >
                          Cost (₹)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailEntries.map((entry) => (
                        <TableRow
                          key={entry._id}
                          sx={{
                            "&:hover": { bgcolor: "#F8FAFC" },
                            transition: "background 0.2s",
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              {new Date(entry.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              })}
                              {entry.notes && (
                                <Tooltip title={entry.notes} arrow>
                                  <WarningAmberRounded
                                    sx={{ fontSize: 14, color: "#F59E0B" }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              fontFamily: "monospace",
                              color: "#475569",
                            }}
                          >
                            #{entry.receiptNumber}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8rem" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Avatar
                                src={entry.driverId?.photoUrl}
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: "4px",
                                  fontSize: "0.55rem",
                                  bgcolor: "#F5F3FF",
                                  color: "#7C3AED",
                                }}
                              >
                                {(entry.driverId?.name || entry.driverName || "?").charAt(0)}
                              </Avatar>
                              <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                                {entry.driverId?.name || entry.driverName || "—"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                            {entry.litresFilled}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#64748B" }}>
                            {entry.currentOdometer?.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                            {entry.kmTravelled?.toLocaleString() || "—"}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.8rem",
                              color: STATUS_CONFIG[entry.status]?.text || "#475569",
                            }}
                          >
                            {entry.averageKmPerLitre
                              ? entry.averageKmPerLitre.toFixed(2)
                              : "—"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                            {entry.fuelCost ? `₹${entry.fuelCost.toLocaleString()}` : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* ── Bus Documents Section ── */}
              <Divider sx={{ my: 3 }} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <DescriptionTwoTone sx={{ fontSize: 18, color: "#7C3AED" }} />
                Documents ({detailDocuments.length})
                {/* Expiry alert badges */}
                {detailDocuments.some((d) => new Date(d.expiryDate) < new Date()) && (
                  <Chip
                    size="small"
                    icon={<ErrorTwoTone sx={{ fontSize: "13px !important" }} />}
                    label="Expired"
                    sx={{ bgcolor: "#FEE2E2", color: "#991B1B", fontWeight: 700, borderRadius: "6px", height: "22px", ml: 0.5 }}
                  />
                )}
                {detailDocuments.some((d) => {
                  const days = Math.ceil((new Date(d.expiryDate) - new Date()) / 86400000);
                  return days >= 0 && days <= 30;
                }) && (
                  <Chip
                    size="small"
                    icon={<WarningAmberTwoTone sx={{ fontSize: "13px !important" }} />}
                    label="Expiring Soon"
                    sx={{ bgcolor: "#FEF9C3", color: "#854D0E", fontWeight: 700, borderRadius: "6px", height: "22px" }}
                  />
                )}
              </Typography>

              {detailDocuments.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor: "#F8FAFC",
                    borderRadius: "16px",
                    border: "1.5px dashed #E2E8F0",
                  }}
                >
                  <Typography sx={{ color: "#94A3B8", fontWeight: 600, fontSize: "0.85rem" }}>
                    No documents added for this bus.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={1.5}>
                  {detailDocuments.map((doc) => {
                    const daysLeft = Math.ceil((new Date(doc.expiryDate) - new Date()) / 86400000);
                    const docStatus =
                      daysLeft < 0
                        ? { label: "Expired", color: "#991B1B", bg: "#FEE2E2", border: "#FECACA", Icon: ErrorTwoTone, iconColor: "#EF4444" }
                        : daysLeft <= 30
                        ? { label: `${daysLeft}d left`, color: "#854D0E", bg: "#FEF9C3", border: "#FDE68A", Icon: WarningAmberTwoTone, iconColor: "#EAB308" }
                        : { label: "Valid", color: "#166534", bg: "#DCFCE7", border: "#BBF7D0", Icon: CheckCircleTwoTone, iconColor: "#22C55E" };
                    const DocIcon = docStatus.Icon;
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc._id}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 1.5,
                            borderRadius: "14px",
                            border: `1.5px solid ${docStatus.border}`,
                            bgcolor: docStatus.bg,
                            transition: "all 0.2s",
                          }}
                        >
                          {/* Icon */}
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "10px",
                              bgcolor: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <DescriptionTwoTone sx={{ fontSize: 22, color: docStatus.iconColor }} />
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.82rem",
                                color: "#0F172A",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {doc.title}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                              <CalendarTodayTwoTone sx={{ fontSize: 11, color: "#94A3B8" }} />
                              <Typography sx={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 600 }}>
                                {new Date(doc.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", gap: 0.75, mt: 0.4, flexWrap: "wrap" }}>
                              <Chip
                                size="small"
                                icon={<DocIcon sx={{ fontSize: "11px !important", color: `${docStatus.iconColor} !important` }} />}
                                label={docStatus.label}
                                sx={{
                                  bgcolor: "white",
                                  color: docStatus.color,
                                  fontWeight: 700,
                                  fontSize: "0.65rem",
                                  borderRadius: "6px",
                                  height: "18px",
                                }}
                              />
                              <Chip
                                size="small"
                                icon={
                                  doc.hasHardCopy
                                    ? <PrintTwoTone sx={{ fontSize: "11px !important", color: "#166534 !important" }} />
                                    : <PrintDisabledTwoTone sx={{ fontSize: "11px !important", color: "#94A3B8 !important" }} />
                                }
                                label={doc.hasHardCopy ? "Hard Copy" : "Digital"}
                                sx={{
                                  bgcolor: doc.hasHardCopy ? "#DCFCE7" : "white",
                                  color: doc.hasHardCopy ? "#166534" : "#94A3B8",
                                  fontWeight: 700,
                                  fontSize: "0.65rem",
                                  borderRadius: "6px",
                                  height: "18px",
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}

              {/* ── Bus Maintenance Section ── */}
              <Divider sx={{ my: 3 }} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <BuildTwoTone sx={{ fontSize: 18, color: "#0891B2" }} />
                Maintenance ({detailMaintenance.length} records)
                {/* Overdue/Due Soon badges using latest odometer from busStats */}
                {(() => {
                  const stats = getBusStats(detailBus?._id);
                  const latestOdo = stats?.latestOdometer;
                  const overdueCount = latestOdo
                    ? detailMaintenance.filter((r) => r.nextDueOdometer && latestOdo >= r.nextDueOdometer).length
                    : 0;
                  const dueSoonCount = latestOdo
                    ? detailMaintenance.filter((r) => {
                        if (!r.nextDueOdometer) return false;
                        const diff = r.nextDueOdometer - latestOdo;
                        return diff > 0 && diff <= 1000;
                      }).length
                    : 0;
                  return (
                    <>
                      {overdueCount > 0 && (
                        <Chip
                          size="small"
                          icon={<ErrorTwoTone sx={{ fontSize: "13px !important" }} />}
                          label={`${overdueCount} Overdue`}
                          sx={{ bgcolor: "#FEE2E2", color: "#991B1B", fontWeight: 700, borderRadius: "6px", height: "22px" }}
                        />
                      )}
                      {dueSoonCount > 0 && (
                        <Chip
                          size="small"
                          icon={<WarningAmberTwoTone sx={{ fontSize: "13px !important" }} />}
                          label={`${dueSoonCount} Due Soon`}
                          sx={{ bgcolor: "#FEF9C3", color: "#854D0E", fontWeight: 700, borderRadius: "6px", height: "22px" }}
                        />
                      )}
                    </>
                  );
                })()}
              </Typography>

              {detailMaintenance.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor: "#F8FAFC",
                    borderRadius: "16px",
                    border: "1.5px dashed #E2E8F0",
                  }}
                >
                  <Typography sx={{ color: "#94A3B8", fontWeight: 600, fontSize: "0.85rem" }}>
                    No maintenance records for this bus.
                  </Typography>
                </Box>
              ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ borderRadius: "16px", border: "1px solid #F1F5F9" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                        {["Date", "Service", "Odometer", "Next Due", "Status", "Cost", "Hard Copy"].map((h) => (
                          <TableCell
                            key={h}
                            sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#475569", py: 1.5 }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailMaintenance.map((rec) => {
                        const stats = getBusStats(detailBus?._id);
                        const latestOdo = stats?.latestOdometer;
                        const diff = latestOdo && rec.nextDueOdometer ? rec.nextDueOdometer - latestOdo : null;
                        const maintStatus =
                          !rec.nextDueOdometer || !latestOdo
                            ? { label: "—", color: "#94A3B8", bg: "#F1F5F9", border: "#E2E8F0", Icon: null }
                            : diff <= 0
                            ? { label: "Overdue", color: "#991B1B", bg: "#FEE2E2", border: "#FECACA", Icon: ErrorTwoTone, iconColor: "#EF4444" }
                            : diff <= 1000
                            ? { label: `${diff.toLocaleString("en-IN")} km`, color: "#854D0E", bg: "#FEF9C3", border: "#FDE68A", Icon: WarningAmberTwoTone, iconColor: "#EAB308" }
                            : { label: "OK", color: "#166534", bg: "#DCFCE7", border: "#BBF7D0", Icon: CheckCircleTwoTone, iconColor: "#22C55E" };
                        const MaintIcon = maintStatus.Icon;
                        return (
                          <TableRow
                            key={rec._id}
                            sx={{ "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}
                          >
                            <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem", color: "#334155" }}>
                              {new Date(rec.datePerformed).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: "#0F172A", maxWidth: 140 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                <Box sx={{ p: 0.4, borderRadius: "6px", bgcolor: "#ECFEFF", color: "#0891B2", display: "flex" }}>
                                  <BuildTwoTone sx={{ fontSize: 12 }} />
                                </Box>
                                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {rec.maintenanceType}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                <SpeedTwoTone sx={{ fontSize: 12, color: "#94A3B8" }} />
                                {rec.odometerAtMaintenance.toLocaleString("en-IN")}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem", color: "#475569" }}>
                              {rec.nextDueOdometer ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                  <LoopTwoTone sx={{ fontSize: 12, color: "#94A3B8" }} />
                                  {rec.nextDueOdometer.toLocaleString("en-IN")}
                                </Box>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              {MaintIcon ? (
                                <Chip
                                  size="small"
                                  icon={<MaintIcon sx={{ fontSize: "11px !important", color: `${maintStatus.iconColor} !important` }} />}
                                  label={maintStatus.label}
                                  sx={{ bgcolor: maintStatus.bg, color: maintStatus.color, fontWeight: 700, fontSize: "0.65rem", borderRadius: "6px", height: "20px", border: `1px solid ${maintStatus.border}` }}
                                />
                              ) : (
                                <Typography sx={{ fontSize: "0.78rem", color: "#CBD5E1" }}>—</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                              {rec.cost ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                                  <CurrencyRupeeTwoTone sx={{ fontSize: 12, color: "#94A3B8" }} />
                                  {rec.cost.toLocaleString("en-IN")}
                                </Box>
                              ) : <Typography sx={{ color: "#CBD5E1", fontSize: "0.78rem" }}>—</Typography>}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                icon={
                                  rec.hasHardCopy
                                    ? <PrintTwoTone sx={{ fontSize: "11px !important", color: "#166534 !important" }} />
                                    : <PrintDisabledTwoTone sx={{ fontSize: "11px !important", color: "#94A3B8 !important" }} />
                                }
                                label={rec.hasHardCopy ? "Hard Copy" : "Digital"}
                                sx={{
                                  bgcolor: rec.hasHardCopy ? "#DCFCE7" : "#F1F5F9",
                                  color: rec.hasHardCopy ? "#166534" : "#64748B",
                                  fontWeight: 700,
                                  fontSize: "0.65rem",
                                  borderRadius: "6px",
                                  height: "20px",
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

            </DialogContent>
          </>
        )}
      </Dialog>


      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={400}
        PaperProps={{
          sx: {
            borderRadius: "28px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            backgroundImage: "none",
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
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                bgcolor: "#F1F5F9",
                color: "#1E293B",
                display: "flex",
              }}
            >
              <DirectionsBusTwoTone />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E293B" }}>
              {isEditing ? "Edit Bus Details" : "Register New Bus"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#64748B", mb: 3, fontWeight: 500 }}
            >
              Fill in the specifications and performance metrics for the
              vehicle.
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Model Name"
                  placeholder="e.g. Tata Marcopolo 2024"
                  value={formData.modelName}
                  onChange={(e) =>
                    setFormData({ ...formData, modelName: e.target.value })
                  }
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Number Plate"
                  placeholder="GJ 01 XX 0000"
                  value={formData.numberPlate}
                  onChange={(e) =>
                    setFormData({ ...formData, numberPlate: e.target.value })
                  }
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Seat Capacity"
                  type="tel"
                  placeholder="0"
                  value={formData.seatCapacity}
                  onChange={(e) =>
                    setFormData({ ...formData, seatCapacity: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <GroupsTwoTone
                        sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Odometer at Registration (km)"
                  type="tel"
                  placeholder="0"
                  value={formData.registrationOdometer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationOdometer: e.target.value,
                    })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <SpeedTwoTone
                        sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                    }}
                  >
                    Efficiency Thresholds (km/L)
                  </Typography>
                </Divider>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Good (≥)"
                  type="tel"
                  inputProps={{ step: "0.1" }}
                  placeholder="e.g. 4.5"
                  value={formData.thresholdGood}
                  onChange={(e) =>
                    setFormData({ ...formData, thresholdGood: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <SentimentSatisfiedAltTwoTone
                        sx={{ mr: 1, color: "#22C55E", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Okay (≥)"
                  type="tel"
                  inputProps={{ step: "0.1" }}
                  placeholder="e.g. 3.5"
                  value={formData.thresholdOkay}
                  onChange={(e) =>
                    setFormData({ ...formData, thresholdOkay: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <SentimentNeutralTwoTone
                        sx={{ mr: 1, color: "#EAB308", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Alarming (<)"
                  type="tel"
                  inputProps={{ step: "0.1" }}
                  placeholder="e.g. 2.5"
                  value={formData.thresholdAlarming}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      thresholdAlarming: e.target.value,
                    })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <SentimentVeryDissatisfiedTwoTone
                        sx={{ mr: 1, color: "#EF4444", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>

              {/* GST Owner */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  select
                  label="GST Owner"
                  value={formData.gstOwner}
                  onChange={(e) =>
                    setFormData({ ...formData, gstOwner: e.target.value })
                  }
                  InputProps={{ sx: { borderRadius: "12px" } }}
                >
                  <MenuItem value="Chintan">Chintan</MenuItem>
                  <MenuItem value="Harsh">Harsh</MenuItem>
                </TextField>
              </Grid>

              {/* Hypothecation Status */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Hypothecation Status"
                  value={formData.hypothecation}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      hypothecation: e.target.value,
                      hypothecationBank:
                        e.target.value === "without"
                          ? ""
                          : formData.hypothecationBank,
                    });
                  }}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                >
                  <MenuItem value="without">Without Hypothecation</MenuItem>
                  <MenuItem value="with">With Hypothecation</MenuItem>
                </TextField>
              </Grid>

              {/* Hypothecation Bank — only if "with" */}
              {formData.hypothecation === "with" && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Hypothecation Bank"
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI…"
                    value={formData.hypothecationBank}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hypothecationBank: e.target.value,
                      })
                    }
                    InputProps={{ sx: { borderRadius: "12px" } }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setOpenDialog(false)}
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
              sx={{
                bgcolor: "#0F172A",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "12px",
                px: 4,
                py: 1.2,
                "&:hover": { bgcolor: "#1E293B" },
              }}
            >
              {isEditing ? "Update Bus" : "Register Bus"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
