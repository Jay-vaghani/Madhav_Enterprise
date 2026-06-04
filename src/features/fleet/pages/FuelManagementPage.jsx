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
  MenuItem,
  Grid,
  Typography,
  Tooltip,
  Fade,
  Divider,
  InputLabel,
  Autocomplete,
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
  LocalGasStationTwoTone,
  CalendarTodayTwoTone,
  PersonTwoTone,
  ConfirmationNumberTwoTone,
  SpeedTwoTone,
  WaterDropTwoTone,
  CurrencyRupeeTwoTone,
  FilterListRounded,
  ShowChartTwoTone,
  WarningAmberRounded,
  RouteRounded,
  TrendingUpRounded,
} from "@mui/icons-material";
import { useAuth } from "../../admin/context/AuthContext";
import {
  fetchAllFuelEntries,
  createFuelEntry,
  updateFuelEntry,
  deleteFuelEntry,
  fetchAllBuses,
  fetchAllDrivers,
} from "../../../api/admin/api";

const STATUS_CONFIG = {
  GOOD: {
    bg: "#DCFCE7",
    text: "#166534",
    label: "Efficient",
    icon: <ShowChartTwoTone sx={{ fontSize: 14, color: "#166534" }} />,
  },
  OKAY: {
    bg: "#FEF9C3",
    text: "#854D0E",
    label: "Normal",
    icon: <ShowChartTwoTone sx={{ fontSize: 14, color: "#854D0E" }} />,
  },
  ALARMING: {
    bg: "#FFEDD5",
    text: "#C2410C",
    label: "Warning",
    icon: <ShowChartTwoTone sx={{ fontSize: 14, color: "#C2410C" }} />,
  },
  VERY_ALARMING: {
    bg: "#FEE2E2",
    text: "#991B1B",
    label: "Critical",
    icon: <ShowChartTwoTone sx={{ fontSize: 14, color: "#991B1B" }} />,
  },
};

// Helper to get current month's first day as YYYY-MM-DD
const getMonthStart = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

// Helper to get today as YYYY-MM-DD
const getToday = () => new Date().toISOString().slice(0, 10);

export default function FuelManagementPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [entries, setEntries] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedBusIdFilter, setSelectedBusIdFilter] = useState("");
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getToday());

  // Price per litre — cached in localStorage
  const [pricePerLitre, setPricePerLitre] = useState(() => {
    return localStorage.getItem("me_fuel_price_per_litre") || "";
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);

  const [formData, setFormData] = useState({
    busId: "",
    driverId: null,
    date: new Date().toISOString().slice(0, 10),
    driverName: "",
    fuelStationName: "",
    receiptNumber: "",
    currentOdometer: "",
    litresFilled: "",
    fuelCost: "",
    notes: "",
  });

  // ── Summary stats computed client-side ──
  const summaryStats = useMemo(() => {
    if (!entries.length) {
      return {
        totalCost: 0,
        totalLitres: 0,
        totalKm: 0,
        avgKmPerLitre: 0,
        avgPricePerLitre: 0,
        estimatedTotalCost: 0,
      };
    }

    const ppl = parseFloat(pricePerLitre) || 0;
    let totalRecordedCost = 0;
    let totalLitres = 0;
    let totalKm = 0;
    let litresWithCost = 0;
    let litresWithoutCost = 0;

    entries.forEach((e) => {
      totalLitres += e.litresFilled || 0;
      totalKm += e.kmTravelled || 0;
      if (e.fuelCost && e.fuelCost > 0) {
        totalRecordedCost += e.fuelCost;
        litresWithCost += e.litresFilled || 0;
      } else {
        litresWithoutCost += e.litresFilled || 0;
      }
    });

    const estimatedCost = totalRecordedCost + litresWithoutCost * ppl;
    const avgPricePerLitre =
      litresWithCost > 0 ? totalRecordedCost / litresWithCost : ppl;

    return {
      totalCost: totalRecordedCost,
      totalLitres,
      totalKm,
      avgKmPerLitre: totalLitres > 0 ? totalKm / totalLitres : 0,
      avgPricePerLitre,
      estimatedTotalCost: estimatedCost,
    };
  }, [entries, pricePerLitre]);

  // ── Per-bus breakdown computed client-side ──
  const busBreakdown = useMemo(() => {
    if (!entries.length || !buses.length) return [];

    const busMap = {};
    entries.forEach((e) => {
      const busId =
        typeof e.busId === "object" ? e.busId?._id : e.busId;
      if (!busId) return;
      if (!busMap[busId]) {
        busMap[busId] = {
          busId,
          numberPlate: e.busId?.numberPlate || "Unknown",
          modelName: e.busId?.modelName || "Unknown",
          totalCost: 0,
          totalLitres: 0,
          totalKm: 0,
          entryCount: 0,
          litresWithoutCost: 0,
        };
      }
      busMap[busId].totalLitres += e.litresFilled || 0;
      busMap[busId].totalKm += e.kmTravelled || 0;
      busMap[busId].entryCount += 1;
      if (e.fuelCost && e.fuelCost > 0) {
        busMap[busId].totalCost += e.fuelCost;
      } else {
        busMap[busId].litresWithoutCost += e.litresFilled || 0;
      }
    });

    const ppl = parseFloat(pricePerLitre) || 0;
    return Object.values(busMap)
      .map((b) => ({
        ...b,
        estimatedCost: b.totalCost + b.litresWithoutCost * ppl,
        avgKmPerLitre: b.totalLitres > 0 ? b.totalKm / b.totalLitres : 0,
      }))
      .sort((a, b) => b.estimatedCost - a.estimatedCost);
  }, [entries, buses, pricePerLitre]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const [entriesRes, busesRes, driversRes] = await Promise.all([
        fetchAllFuelEntries(token, selectedBusIdFilter, startDate, endDate),
        fetchAllBuses(token),
        fetchAllDrivers(token),
      ]);
      setEntries(entriesRes.fuelEntries || []);
      setBuses(busesRes.buses || []);
      setDrivers(driversRes.drivers || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedBusIdFilter, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cache price per litre
  useEffect(() => {
    if (pricePerLitre) {
      localStorage.setItem("me_fuel_price_per_litre", pricePerLitre);
    }
  }, [pricePerLitre]);

  const handleOpenNew = () => {
    setIsEditing(false);
    setCurrentEntryId(null);
    setFormData({
      busId: selectedBusIdFilter || (buses.length > 0 ? buses[0]._id : ""),
      driverId: null,
      date: new Date().toISOString().slice(0, 10),
      driverName: "",
      fuelStationName: "",
      receiptNumber: "",
      currentOdometer: "",
      litresFilled: "",
      fuelCost: "",
      notes: "",
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (entry) => {
    setIsEditing(true);
    setCurrentEntryId(entry._id);
    setFormData({
      busId: entry.busId?._id || entry.busId,
      driverId: entry.driverId?._id || entry.driverId || null,
      date: entry.date ? new Date(entry.date).toISOString().slice(0, 10) : "",
      driverName: entry.driverName || "",
      fuelStationName: entry.fuelStationName || "",
      receiptNumber: entry.receiptNumber || "",
      currentOdometer: entry.currentOdometer || "",
      litresFilled: entry.litresFilled || "",
      fuelCost: entry.fuelCost || "",
      notes: entry.notes || "",
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this fuel entry? Metrics will be recalculated.",
      )
    )
      return;
    try {
      await deleteFuelEntry(token, id);
      setSuccess("Fuel entry deleted successfully");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      busId: formData.busId,
      driverId: formData.driverId || undefined,
      date: formData.date,
      driverName: formData.driverName,
      fuelStationName: formData.fuelStationName,
      receiptNumber: formData.receiptNumber,
      currentOdometer: Number(formData.currentOdometer),
      litresFilled: Number(formData.litresFilled),
      fuelCost: formData.fuelCost ? Number(formData.fuelCost) : undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (isEditing) {
        await updateFuelEntry(token, currentEntryId, payload);
        setSuccess("Fuel entry updated successfully");
      } else {
        await createFuelEntry(token, payload);
        setSuccess("Fuel entry added successfully");
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetFilters = () => {
    setSelectedBusIdFilter("");
    setStartDate(getMonthStart());
    setEndDate(getToday());
  };

  // KPI Card component
  const KPICard = ({ icon, label, value, sub, color, bgGradient }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "20px",
        border: "1px solid #F1F5F9",
        background: bgGradient || "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        flex: 1,
        minWidth: 150,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            p: 0.8,
            borderRadius: "10px",
            bgcolor: `${color}15`,
            color: color,
            display: "flex",
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontSize: "0.7rem",
            color: "#64748B",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: "1.5rem",
          color: "#0F172A",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}
      >
        {value}
      </Typography>
      {sub && (
        <Typography
          sx={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 600, mt: 0.5 }}
        >
          {sub}
        </Typography>
      )}
    </Paper>
  );

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header & Primary Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }} alignItems="center">
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: "14px",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "white",
                display: "flex",
                boxShadow: "0 6px 12px rgba(16, 185, 129, 0.2)",
              }}
            >
              <LocalGasStationTwoTone sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: "#0F172A",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Fuel Management
                </Typography>
                <Chip
                  label={`${entries.length} Records`}
                  size="small"
                  sx={{
                    bgcolor: "#ECFDF5",
                    color: "#059669",
                    fontWeight: 800,
                    borderRadius: "8px",
                  }}
                />
              </Box>
              <Typography
                sx={{ color: "#64748B", fontSize: "1rem", fontWeight: 500 }}
              >
                Track vehicle efficiency and fuel expenditures.
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            display: "flex",
            justifyContent: { xs: "flex-start", md: "flex-end" },
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={handleOpenNew}
            sx={{
              background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
              color: "white",
              textTransform: "none",
              borderRadius: "14px",
              px: 4,
              py: 1.4,
              fontWeight: 800,
              fontSize: "0.95rem",
              boxShadow: "0 10px 20px rgba(15, 23, 42, 0.15)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 20px 30px rgba(15, 23, 42, 0.2)",
              },
            }}
          >
            Record New Fill-up
          </Button>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: "24px",
          border: "1px solid #F1F5F9",
          bgcolor: "#F8FAFC",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <InputLabel sx={{ color: "#1E293B", fontWeight: 600, mb: 0.5 }}>
              From Date
            </InputLabel>
            <TextField
              fullWidth
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "white",
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <InputLabel sx={{ color: "#1E293B", fontWeight: 600, mb: 0.5 }}>
              To Date
            </InputLabel>
            <TextField
              fullWidth
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "white",
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <InputLabel sx={{ color: "#1E293B", fontWeight: 600, mb: 0.5 }}>
              Filter by Vehicle
            </InputLabel>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedBusIdFilter}
              onChange={(e) => setSelectedBusIdFilter(e.target.value)}
              InputProps={{
                sx: { borderRadius: "12px", bgcolor: "white" },
                startAdornment: (
                  <FilterListRounded
                    sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                  />
                ),
              }}
            >
              <MenuItem value="">
                <em>Show all active buses</em>
              </MenuItem>
              {buses.map((bus) => (
                <MenuItem key={bus._id} value={bus._id}>
                  {bus.numberPlate} — {bus.modelName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <InputLabel sx={{ color: "#1E293B", fontWeight: 600, mb: 0.5 }}>
              Price / Litre (₹)
            </InputLabel>
            <TextField
              fullWidth
              size="small"
              type="tel"
              placeholder="e.g. 96.72"
              value={pricePerLitre}
              onChange={(e) => setPricePerLitre(e.target.value)}
              InputProps={{
                sx: { borderRadius: "12px", bgcolor: "white" },
                startAdornment: (
                  <CurrencyRupeeTwoTone
                    sx={{ mr: 0.5, color: "#94A3B8", fontSize: 18 }}
                  />
                ),
              }}
            />
          </Grid>
          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilters}
              disabled={
                startDate === getMonthStart() &&
                endDate === getToday() &&
                !selectedBusIdFilter
              }
              sx={{
                height: 40,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                borderColor: "#E2E8F0",
                color: "#475569",
                "&:hover": {
                  borderColor: "#CBD5E1",
                  bgcolor: "#F1F5F9",
                },
              }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

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

      {/* ── Summary KPI Cards ── */}
      {!isLoading && entries.length > 0 && (
        <Fade in timeout={500}>
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                mb: 3,
              }}
            >
              <KPICard
                icon={<CurrencyRupeeTwoTone sx={{ fontSize: 20 }} />}
                label="Total Fuel Cost"
                value={`₹${summaryStats.estimatedTotalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                sub={
                  summaryStats.totalCost !== summaryStats.estimatedTotalCost
                    ? `₹${summaryStats.totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })} recorded + estimated`
                    : `${entries.length} fill-ups`
                }
                color="#10B981"
              />
              <KPICard
                icon={<WaterDropTwoTone sx={{ fontSize: 20 }} />}
                label="Total Litres"
                value={summaryStats.totalLitres.toLocaleString("en-IN", {
                  maximumFractionDigits: 1,
                })}
                sub="litres consumed"
                color="#3B82F6"
              />
              <KPICard
                icon={<RouteRounded sx={{ fontSize: 20 }} />}
                label="Total Kilometres"
                value={summaryStats.totalKm.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
                sub="km fleet distance"
                color="#8B5CF6"
              />
              <KPICard
                icon={<TrendingUpRounded sx={{ fontSize: 20 }} />}
                label="Fleet Average"
                value={`${summaryStats.avgKmPerLitre.toFixed(2)} km/L`}
                sub="overall efficiency"
                color="#F59E0B"
              />
            </Box>

            {/* ── Summary Context Inputs ── */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: "20px",
                border: "1px dashed #E2E8F0",
                bgcolor: "#F8FAFC",
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter summary receipt number..."
                    label="Summary Receipt Number"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: { borderRadius: "12px", bgcolor: "white" },
                      startAdornment: (
                        <ConfirmationNumberTwoTone sx={{ mr: 1, color: "#94A3B8", fontSize: 18 }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add context notes for this period..."
                    label="Additional Notes"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: { borderRadius: "12px", bgcolor: "white" },
                      startAdornment: (
                        <WarningAmberRounded sx={{ mr: 1, color: "#94A3B8", fontSize: 18 }} />
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* ── Per-Bus Breakdown Table ── */}
            {busBreakdown.length > 1 && (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "20px",
                  border: "1px solid #F1F5F9",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    bgcolor: "#F8FAFC",
                    borderBottom: "1px solid #F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <ShowChartTwoTone sx={{ fontSize: 18, color: "#475569" }} />
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Per-Bus Breakdown
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ fontWeight: 800, color: "#475569", fontSize: "0.75rem" }}
                        >
                          Vehicle
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#475569", fontSize: "0.75rem" }}
                        >
                          Entries
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#475569", fontSize: "0.75rem" }}
                        >
                          Litres
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#475569", fontSize: "0.75rem" }}
                        >
                          KM
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#475569", fontSize: "0.75rem" }}
                        >
                          Avg km/L
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 800, color: "#475569", fontSize: "0.75rem" }}
                        >
                          Cost (₹)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {busBreakdown.map((bus) => (
                        <TableRow
                          key={bus.busId}
                          sx={{
                            "&:hover": { bgcolor: "#F8FAFC" },
                            transition: "background 0.2s ease",
                          }}
                        >
                          <TableCell>
                            <Box>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                  color: "#0F172A",
                                }}
                              >
                                {bus.numberPlate}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.7rem",
                                  color: "#94A3B8",
                                  fontWeight: 500,
                                }}
                              >
                                {bus.modelName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: "#475569",
                              fontSize: "0.85rem",
                            }}
                          >
                            {bus.entryCount}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: "#475569",
                              fontSize: "0.85rem",
                            }}
                          >
                            {bus.totalLitres.toLocaleString("en-IN", {
                              maximumFractionDigits: 1,
                            })}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: "#475569",
                              fontSize: "0.85rem",
                            }}
                          >
                            {bus.totalKm.toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              color:
                                bus.avgKmPerLitre >= 4
                                  ? "#166534"
                                  : bus.avgKmPerLitre >= 3
                                    ? "#854D0E"
                                    : "#991B1B",
                            }}
                          >
                            {bus.avgKmPerLitre.toFixed(2)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: "#475569",
                              fontSize: "0.85rem",
                            }}
                          >
                            ₹
                            {bus.estimatedCost.toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Box>
        </Fade>
      )}

      {/* Main Content */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress thickness={5} size={48} sx={{ color: "#10B981" }} />
        </Box>
      ) : entries.length === 0 ? (
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
            <LocalGasStationTwoTone sx={{ fontSize: 64 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#475569", mb: 1 }}
          >
            No Fuel Entries
          </Typography>
          <Typography sx={{ color: "#94A3B8", mb: 4 }}>
            Record your first fuel fill-up to start tracking efficiency.
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
            Record Fuel
          </Button>
        </Box>
      ) : (
        <Grid container spacing={1.5}>
          {entries.map((entry, index) => (
            <Grid size={{ xs: 12 }} key={entry._id}>
              <Fade in timeout={200 + index * 50}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 1.2 },
                    px: { md: 3 },
                    borderRadius: "16px",
                    border: "1px solid #F1F5F9",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "flex-start", md: "center" },
                    gap: { xs: 2, md: 4 },
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      bgcolor: "#F8FAFC",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                      border: "1px solid #E2E8F0",
                      "& .entry-actions": {
                        opacity: 1,
                        transform: "translateX(0)",
                      },
                    },
                  }}
                >
                  {/* Left: Date & Bus Section */}
                  <Box sx={{ minWidth: { md: 140 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          color: "#0F172A",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        {entry.busId?.numberPlate || "Unknown"}
                      </Typography>
                      {/* Notes warning icon */}
                      {entry.notes && (
                        <Tooltip title={entry.notes} arrow>
                          <WarningAmberRounded
                            sx={{
                              fontSize: 16,
                              color: "#F59E0B",
                              cursor: "pointer",
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    <Typography
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#64748B",
                        mt: 0.2,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <CalendarTodayTwoTone
                        sx={{ fontSize: 14, color: "#64748B" }}
                      />
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Typography>
                  </Box>

                  {/* Divider for mobile */}
                  <Divider
                    sx={{
                      display: { xs: "block", md: "none" },
                      width: "100%",
                      opacity: 0.5,
                    }}
                  />

                  {/* Middle: Key Metrics Horizontal Row */}
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: { xs: 3, md: 5 },
                    }}
                  >
                    {/* Receipt Number */}
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          color: "#94A3B8",
                          fontWeight: 800,
                          mb: 0.2,
                          textTransform: "uppercase",
                        }}
                      >
                        Receipt
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <ConfirmationNumberTwoTone
                          sx={{ fontSize: 16, color: "#8B5CF6" }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: "#1E293B",
                            fontFamily: "monospace",
                          }}
                        >
                          #{entry.receiptNumber}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Litres filled */}
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          color: "#94A3B8",
                          fontWeight: 800,
                          mb: 0.2,
                          textTransform: "uppercase",
                        }}
                      >
                        Litres
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <WaterDropTwoTone
                          sx={{ fontSize: 16, color: "#3B82F6" }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: "#1E293B",
                          }}
                        >
                          {entry.litresFilled}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Odometer Reading */}
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          color: "#94A3B8",
                          fontWeight: 800,
                          mb: 0.2,
                          textTransform: "uppercase",
                        }}
                      >
                        Odometer
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <SpeedTwoTone sx={{ fontSize: 16, color: "#64748B" }} />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: "#1E293B",
                          }}
                        >
                          {entry.currentOdometer?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Cost - Hidden on small mobile */}
                    <Box sx={{ display: { xs: "none", sm: "block" } }}>
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          color: "#94A3B8",
                          fontWeight: 800,
                          mb: 0.2,
                          textTransform: "uppercase",
                        }}
                      >
                        Cost
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <CurrencyRupeeTwoTone
                          sx={{ fontSize: 16, color: "#10B981" }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: "#1E293B",
                          }}
                        >
                          {entry.fuelCost
                            ? entry.fuelCost.toLocaleString()
                            : "—"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Driver & Details - Collapsed on mobile */}
                    <Box
                      sx={{
                        display: { xs: "none", lg: "flex" },
                        flexDirection: "column",
                        gap: 0.2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Avatar
                          src={entry.driverId?.photoUrl}
                          sx={{ width: 20, height: 20, borderRadius: "4px", fontSize: "0.55rem", bgcolor: "#F5F3FF", color: "#7C3AED" }}
                        >
                          {(entry.driverId?.name || entry.driverName || "?").charAt(0)}
                        </Avatar>
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          {entry.driverId?.name || entry.driverName || "Unknown"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Right: Performance Section */}
                  <Box
                    sx={{
                      minWidth: { md: 150 },
                      textAlign: { xs: "left", md: "right" },
                      display: "flex",
                      flexDirection: { xs: "row", md: "column" },
                      alignItems: { xs: "center", md: "flex-end" },
                      gap: { xs: 2, md: 0 },
                    }}
                  >
                    {entry.averageKmPerLitre ? (
                      <>
                        <Typography
                          sx={{
                            fontWeight: 950,
                            fontSize: "1.1rem",
                            color:
                              STATUS_CONFIG[entry.status]?.text || "#1E293B",
                          }}
                        >
                          {entry.averageKmPerLitre.toFixed(2)}
                          <Box
                            component="span"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              ml: 0.5,
                            }}
                          >
                            km/L
                          </Box>
                        </Typography>
                        <Chip
                          icon={STATUS_CONFIG[entry.status]?.icon}
                          label={
                            STATUS_CONFIG[entry.status]?.label || entry.status
                          }
                          size="small"
                          sx={{
                            mt: { md: 0.2 },
                            height: 18,
                            fontSize: "0.6rem",
                            fontWeight: 900,
                            bgcolor:
                              STATUS_CONFIG[entry.status]?.bg || "#F1F5F9",
                            color:
                              STATUS_CONFIG[entry.status]?.text || "#64748B",
                            borderRadius: "4px",
                            "& .MuiChip-icon": { fontSize: 12 },
                          }}
                        />
                      </>
                    ) : (
                      <Chip
                        label="Initial Entry"
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 20,
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          color: "#94A3B8",
                          borderColor: "#E2E8F0",
                        }}
                      />
                    )}
                  </Box>

                  {/* Floating Action Menu for row hover */}
                  <Box
                    className="entry-actions"
                    sx={{
                      opacity: { xs: 1, md: 0 },
                      transform: { md: "translateX(20px)" },
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      gap: 0.5,
                      bgcolor: "white",
                      borderRadius: "10px",
                      p: 0.5,
                      border: "1px solid #E2E8F0",
                      position: { xs: "absolute", md: "static" },
                      top: 10,
                      right: 10,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  >
                    {isAdmin && (
                      <>
                        <Tooltip title="Edit Record">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(entry)}
                            sx={{
                              color: "#3B82F6",
                              "&:hover": { bgcolor: "#EFF6FF" },
                            }}
                          >
                            <EditTwoTone sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Record">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(entry._id)}
                            sx={{
                              color: "#EF4444",
                              "&:hover": { bgcolor: "#FEF2F2" },
                            }}
                          >
                            <DeleteTwoTone sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Paper>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "28px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              p: 3,
              pb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: "10px",
                bgcolor: "#ECFDF5",
                color: "#059669",
                display: "flex",
              }}
            >
              <LocalGasStationTwoTone />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E293B" }}>
              {isEditing ? "Edit Fuel Entry" : "Record Fuel Fill-up"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#64748B", mb: 3, fontWeight: 500 }}
            >
              Provide the details from the fuel receipt to update performance
              metrics.
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Select Bus"
                  value={formData.busId}
                  onChange={(e) =>
                    setFormData({ ...formData, busId: e.target.value })
                  }
                  disabled={isEditing && !isAdmin}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                >
                  {buses.map((bus) => (
                    <MenuItem key={bus._id} value={bus._id}>
                      {bus.numberPlate} ({bus.modelName})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={drivers}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : `${option.name} (${option.mobile})`
                  }
                  value={
                    formData.driverId
                      ? drivers.find((d) => d._id === formData.driverId) ||
                        null
                      : null
                  }
                  onChange={(_, newValue) => {
                    if (newValue) {
                      // Driver selected from list
                      setFormData({
                        ...formData,
                        driverId: newValue._id,
                        driverName: newValue.name,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        driverId: null,
                        driverName: "",
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Driver"
                      placeholder="Select a driver"
                      InputProps={{
                        ...params.InputProps,
                        sx: { borderRadius: "12px" },
                        startAdornment: (
                          <PersonTwoTone
                            sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                          />
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <Box
                        component="li"
                        key={key}
                        {...rest}
                        sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}
                      >
                        <Avatar
                          src={option.photoUrl}
                          sx={{ width: 32, height: 32, borderRadius: "8px", fontSize: "0.8rem" }}
                        >
                          {option.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                            {option.name}
                          </Typography>
                          <Typography sx={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                            {option.mobile}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option._id === value._id
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fuel Station"
                  placeholder="Station name / location"
                  value={formData.fuelStationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fuelStationName: e.target.value,
                    })
                  }
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Receipt Number"
                  placeholder="Invoice #"
                  value={formData.receiptNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, receiptNumber: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <ConfirmationNumberTwoTone
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
                  label="Odometer (km)"
                  type="tel"
                  placeholder="Current reading"
                  value={formData.currentOdometer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentOdometer: e.target.value,
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Litres Filled"
                  type="tel"
                  inputProps={{ step: "0.1" }}
                  placeholder="0.00"
                  value={formData.litresFilled}
                  onChange={(e) =>
                    setFormData({ ...formData, litresFilled: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <WaterDropTwoTone
                        sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Total Cost (₹)"
                  type="tel"
                  placeholder="0.00"
                  value={formData.fuelCost}
                  onChange={(e) =>
                    setFormData({ ...formData, fuelCost: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <CurrencyRupeeTwoTone
                        sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>

              {/* Notes field */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  label="Notes (optional)"
                  placeholder="Add notes about this fill-up (e.g., tank leakage, unusual conditions)..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <WarningAmberRounded
                        sx={{
                          mr: 1,
                          color: "#94A3B8",
                          fontSize: 20,
                          alignSelf: "flex-start",
                          mt: 1,
                        }}
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
              {isEditing ? "Update Record" : "Save Record"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
