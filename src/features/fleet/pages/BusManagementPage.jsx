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
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
} from "@mui/icons-material";
import { useAuth } from "../../admin/context/AuthContext";
import {
  fetchAllBuses,
  createBus,
  updateBus,
  deleteBus,
  fetchFuelAnalytics,
  fetchAllFuelEntries,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBusId, setCurrentBusId] = useState(null);

  // Bus detail dialog state
  const [detailBus, setDetailBus] = useState(null);
  const [detailEntries, setDetailEntries] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [formData, setFormData] = useState({
    modelName: "",
    numberPlate: "",
    seatCapacity: "",
    registrationOdometer: "",
    thresholdGood: "",
    thresholdOkay: "",
    thresholdAlarming: "",
  });

  const loadBuses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const [busesRes, analyticsRes] = await Promise.all([
        fetchAllBuses(token),
        fetchFuelAnalytics(token), // All-time stats
      ]);
      setBuses(busesRes.buses || []);
      setBusStats(analyticsRes.analytics?.busStats || []);
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

  // Open bus detail dialog
  const handleOpenDetail = async (bus) => {
    setDetailBus(bus);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetchAllFuelEntries(token, bus._id);
      setDetailEntries(res.fuelEntries || []);
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

      {/* Notifications */}
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
      ) : buses.length === 0 ? (
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
            <DirectionsBusTwoTone sx={{ fontSize: 64 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#475569", mb: 1 }}
          >
            No Buses Registered
          </Typography>
          <Typography sx={{ color: "#94A3B8", mb: 4 }}>
            Start by adding your first bus to the fleet.
          </Typography>
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
        </Box>
      ) : (
        <Grid container spacing={3.5}>
          {buses.map((bus, index) => {
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
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}
                        >
                          {bus.modelName}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
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
