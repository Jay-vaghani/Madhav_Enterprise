import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  Zoom,
  Divider,
  Avatar,
  Badge,
  InputLabel,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
} from "@mui/material";
import {
  AddRounded,
  EditTwoTone,
  DeleteTwoTone,
  PersonTwoTone,
  PhoneTwoTone,
  CreditCardTwoTone,
  AccountBalanceTwoTone,
  BadgeTwoTone,
  CalendarTodayTwoTone,
  CameraAltTwoTone,
  DirectionsBusTwoTone,
  CloseTwoTone,
  RouteRounded,
  TrendingUpTwoTone,
  ShowChartTwoTone,
  LocalGasStationTwoTone,
  LeaderboardRounded,
  GridViewRounded,
  EmojiEventsTwoTone,
  WarningAmberRounded,
  ConfirmationNumberTwoTone,
  WaterDropTwoTone,
  SpeedTwoTone,
  SearchOutlined,
  CloseRounded,
} from "@mui/icons-material";
import { useAuth } from "../../admin/context/AuthContext";
import {
  fetchAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  fetchFuelAnalytics,
  fetchAllFuelEntries,
  fetchAllBuses,
} from "../../../api/admin/api";
import ImageCropModal from "../../../components/ImageCropModal";

const STATUS_CONFIG = {
  GOOD: { bg: "#DCFCE7", text: "#166534", label: "Good" },
  OKAY: { bg: "#FEF9C3", text: "#854D0E", label: "Okay" },
  ALARMING: { bg: "#FFEDD5", text: "#C2410C", label: "Alarming" },
  VERY_ALARMING: { bg: "#FEE2E2", text: "#991B1B", label: "Critical" },
};

const getMonthStart = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};
const getToday = () => new Date().toISOString().slice(0, 10);

// Determine driver performance status based on fleet average thresholds
const determineDriverStatus = (avgKmL, busStats) => {
  if (!busStats || busStats.length === 0 || avgKmL <= 0) return null;
  const avgGood =
    busStats.reduce((s, b) => s + (b.thresholdGood || 4), 0) / busStats.length;
  const avgOkay =
    busStats.reduce((s, b) => s + (b.thresholdOkay || 3), 0) / busStats.length;
  const avgAlarming =
    busStats.reduce((s, b) => s + (b.thresholdAlarming || 2), 0) /
    busStats.length;
  if (avgKmL >= avgGood) return "GOOD";
  if (avgKmL >= avgOkay) return "OKAY";
  if (avgKmL >= avgAlarming) return "ALARMING";
  return "VERY_ALARMING";
};

export default function DriverManagementPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [driverStats, setDriverStats] = useState([]);
  const [busStats, setBusStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Date range for analytics
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getToday());

  // View mode: cards vs leaderboard
  const [viewMode, setViewMode] = useState("cards");

  // Frontend name search
  const [searchQuery, setSearchQuery] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDriverId, setCurrentDriverId] = useState(null);

  // Driver detail dialog
  const [detailDriver, setDetailDriver] = useState(null);
  const [detailEntries, setDetailEntries] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // Image crop state
  const [photoSrc, setPhotoSrc] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingPhotoBase64, setPendingPhotoBase64] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    licenseNumber: "",
    licenseExpiryDate: "",
    bankAccountNumber: "",
    ifscCode: "",
    assignedBusId: null,
  });

  const loadDrivers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const [driversRes, analyticsRes, busesRes] = await Promise.all([
        fetchAllDrivers(token),
        fetchFuelAnalytics(token, startDate, endDate),
        fetchAllBuses(token),
      ]);
      setDrivers(driversRes.drivers || []);
      setDriverStats(analyticsRes.analytics?.driverStats || []);
      setBusStats(analyticsRes.analytics?.busStats || []);
      setBuses(busesRes.buses || []);
    } catch (err) {
      setError(err.message || "Failed to load drivers");
    } finally {
      setIsLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  // Get stats for a specific driver
  const getDriverStats = (driverId) => {
    return (
      driverStats.find((s) => s.driverId === driverId || s._id === driverId) ||
      null
    );
  };

  // Leaderboard data — drivers sorted by avg km/L
  const leaderboardData = useMemo(() => {
    return driverStats
      .filter((d) => d.entryCount > 0)
      .sort((a, b) => b.avgKmPerLitre - a.avgKmPerLitre);
  }, [driverStats]);

  // ── Frontend-filtered lists (name search, case-insensitive) ──
  const q = searchQuery.trim().toLowerCase();
  const filteredDrivers = useMemo(
    () =>
      q ? drivers.filter((d) => d.name?.toLowerCase().includes(q)) : drivers,
    [drivers, q],
  );
  const filteredLeaderboard = useMemo(
    () =>
      q
        ? leaderboardData.filter((d) => d.name?.toLowerCase().includes(q))
        : leaderboardData,
    [leaderboardData, q],
  );

  // Open driver detail dialog
  const handleOpenDetail = async (driver) => {
    setDetailDriver(driver);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetchAllFuelEntries(token, "", "", "", driver._id);
      setDetailEntries(res.fuelEntries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // Bus breakdown from detail entries
  const detailBusBreakdown = useMemo(() => {
    if (!detailEntries.length) return [];
    const map = {};
    detailEntries.forEach((e) => {
      const busId = typeof e.busId === "object" ? e.busId?._id : e.busId;
      if (!busId) return;
      if (!map[busId]) {
        map[busId] = {
          busId,
          numberPlate: e.busId?.numberPlate || "Unknown",
          modelName: e.busId?.modelName || "Unknown",
          totalKm: 0,
          totalLitres: 0,
          entryCount: 0,
        };
      }
      map[busId].totalKm += e.kmTravelled || 0;
      map[busId].totalLitres += e.litresFilled || 0;
      map[busId].entryCount += 1;
    });
    return Object.values(map).map((b) => ({
      ...b,
      avgKmPerLitre: b.totalLitres > 0 ? b.totalKm / b.totalLitres : 0,
    }));
  }, [detailEntries]);

  const handleOpenNew = () => {
    setIsEditing(false);
    setCurrentDriverId(null);
    setPendingPhotoBase64(null);
    setPhotoSrc(null);
    setFormData({
      name: "",
      mobile: "",
      licenseNumber: "",
      licenseExpiryDate: "",
      bankAccountNumber: "",
      ifscCode: "",
      assignedBusId: null,
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (driver) => {
    setIsEditing(true);
    setCurrentDriverId(driver._id);
    setPendingPhotoBase64(null);
    setPhotoSrc(null);
    setFormData({
      name: driver.name || "",
      mobile: driver.mobile || "",
      licenseNumber: driver.licenseNumber || "",
      licenseExpiryDate: driver.licenseExpiryDate
        ? new Date(driver.licenseExpiryDate).toISOString().slice(0, 10)
        : "",
      bankAccountNumber: driver.bankAccountNumber || "",
      ifscCode: driver.ifscCode || "",
      assignedBusId: driver.assignedBusId?._id || driver.assignedBusId || null,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this driver? This will unlink them from all fuel entries.",
      )
    )
      return;
    try {
      await deleteDriver(token, id);
      setSuccess("Driver deleted successfully");
      loadDrivers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoSrc(reader.result);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = (croppedBase64) => {
    setPendingPhotoBase64(croppedBase64);
    setCropOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      name: formData.name,
      mobile: formData.mobile,
      licenseNumber: formData.licenseNumber,
      licenseExpiryDate: formData.licenseExpiryDate,
      bankAccountNumber: formData.bankAccountNumber,
      ifscCode: formData.ifscCode,
      assignedBusId: formData.assignedBusId || undefined,
    };

    if (pendingPhotoBase64) {
      payload.photoBase64 = pendingPhotoBase64;
    }

    try {
      if (isEditing) {
        await updateDriver(token, currentDriverId, payload);
        setSuccess("Driver updated successfully");
      } else {
        await createDriver(token, payload);
        setSuccess("Driver registered successfully");
      }
      setOpenDialog(false);
      setPendingPhotoBase64(null);
      loadDrivers();
    } catch (err) {
      setError(err.message);
    }
  };

  const isLicenseExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffDays = (exp - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 30 && diffDays >= 0;
  };

  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getLicenseBadgeColor = (expiryDate) => {
    if (isLicenseExpired(expiryDate)) return "#EF4444";
    if (isLicenseExpiringSoon(expiryDate)) return "#F59E0B";
    return "#22C55E";
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
          mb: 4,
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
                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                color: "white",
                display: "flex",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
              }}
            >
              <PersonTwoTone />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 850,
                color: "#1E293B",
                letterSpacing: "-0.02em",
              }}
            >
              Driver Management
            </Typography>
            <Chip
              label={drivers.length}
              size="small"
              sx={{
                bgcolor: "#F5F3FF",
                color: "#7C3AED",
                fontWeight: 800,
                fontSize: "0.85rem",
                borderRadius: "8px",
                height: "24px",
                px: 0.5,
              }}
            />
          </Box>
          <Typography sx={{ color: "#64748B", fontSize: "0.95rem", ml: 6 }}>
            Track driver performance, license validity, and fuel efficiency
            rankings.
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
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.2)",
            },
          }}
        >
          Add New Driver
        </Button>
      </Box>

      {/* Date Range Filter + Search + View Toggle */}
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
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <InputLabel
              sx={{
                color: "#1E293B",
                fontWeight: 600,
                mb: 0.5,
                fontSize: "0.8rem",
              }}
            >
              From Date
            </InputLabel>
            <TextField
              fullWidth
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "white",
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <InputLabel
              sx={{
                color: "#1E293B",
                fontWeight: 600,
                mb: 0.5,
                fontSize: "0.8rem",
              }}
            >
              To Date
            </InputLabel>
            <TextField
              fullWidth
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "white",
                },
              }}
            />
          </Grid>

          {/* Name search */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InputLabel
              sx={{
                color: "#1E293B",
                fontWeight: 600,
                mb: 0.5,
                fontSize: "0.8rem",
              }}
            >
              Search Driver
            </InputLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name…"
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
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#E2E8F0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#CBD5E1",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#7C3AED",
                  },
                },
              }}
            />
          </Grid>

          <Grid
            size={{ xs: 12, sm: 12, md: 4 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "flex-end",
            }}
          >
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
              sx={{
                bgcolor: "white",
                borderRadius: "12px",
                "& .MuiToggleButton-root": {
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  px: 2.5,
                  border: "none",
                  "&.Mui-selected": {
                    bgcolor: "#0F172A",
                    color: "white",
                    "&:hover": { bgcolor: "#1E293B" },
                  },
                },
              }}
            >
              <ToggleButton value="cards">
                <GridViewRounded sx={{ fontSize: 18, mr: 0.5 }} /> Cards
              </ToggleButton>
              <ToggleButton value="leaderboard">
                <LeaderboardRounded sx={{ fontSize: 18, mr: 0.5 }} />{" "}
                Leaderboard
              </ToggleButton>
            </ToggleButtonGroup>
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

      {/* Main Content */}
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            minHeight: "40vh",
            alignItems: "center",
          }}
        >
          <CircularProgress
            thickness={5}
            size={48}
            sx={{ color: "#7C3AED", opacity: 0.8 }}
          />
        </Box>
      ) : filteredDrivers.length === 0 ? (
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
            }}
          >
            {searchQuery ? (
              <SearchOutlined sx={{ fontSize: 64 }} />
            ) : (
              <PersonTwoTone sx={{ fontSize: 64 }} />
            )}
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#475569", mb: 1 }}
          >
            {searchQuery
              ? `No drivers matching "${searchQuery}"`
              : "No Drivers Registered"}
          </Typography>
          <Typography sx={{ color: "#94A3B8", mb: 4 }}>
            {searchQuery
              ? "Try a different name or clear the search."
              : "Start by adding your first driver to the fleet."}
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
              Register Driver
            </Button>
          )}
        </Box>
      ) : viewMode === "leaderboard" ? (
        /* ── LEADERBOARD VIEW ── */
        <Paper
          elevation={0}
          sx={{
            borderRadius: "24px",
            border: "1px solid #F1F5F9",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2.5,
              bgcolor: "#F8FAFC",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <EmojiEventsTwoTone sx={{ fontSize: 22, color: "#F59E0B" }} />
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1rem",
                color: "#0F172A",
              }}
            >
              Driver Efficiency Leaderboard
            </Typography>
            <Chip
              label={`${filteredLeaderboard.length} drivers`}
              size="small"
              sx={{
                bgcolor: "#FEF9C3",
                color: "#854D0E",
                fontWeight: 700,
                borderRadius: "8px",
              }}
            />
          </Box>
          {filteredLeaderboard.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <Typography sx={{ color: "#94A3B8", fontWeight: 600 }}>
                {searchQuery
                  ? `No drivers matching "${searchQuery}" in this date range.`
                  : "No driver data available for the selected date range."}
              </Typography>
              {searchQuery && (
                <Button
                  size="small"
                  onClick={() => setSearchQuery("")}
                  sx={{ mt: 1.5, textTransform: "none", fontWeight: 600 }}
                >
                  Clear Search
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: "#475569",
                        fontSize: "0.75rem",
                        width: 60,
                      }}
                    >
                      Rank
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: "#475569",
                        fontSize: "0.75rem",
                      }}
                    >
                      Driver
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: "#475569",
                        fontSize: "0.75rem",
                      }}
                    >
                      Entries
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: "#475569",
                        fontSize: "0.75rem",
                      }}
                    >
                      Total KM
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: "#475569",
                        fontSize: "0.75rem",
                      }}
                    >
                      Total Litres
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: "#475569",
                        fontSize: "0.75rem",
                      }}
                    >
                      Avg km/L
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 800,
                        color: "#475569",
                        fontSize: "0.75rem",
                      }}
                    >
                      Rating
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeaderboard.map((stat, idx) => {
                    const rank = idx + 1;
                    const status = determineDriverStatus(
                      stat.avgKmPerLitre,
                      busStats,
                    );
                    const medalColors = ["#F59E0B", "#94A3B8", "#CD7F32"];
                    const driver = drivers.find(
                      (d) => d._id === stat.driverId || d._id === stat._id,
                    );
                    return (
                      <TableRow
                        key={stat.driverId || stat._id}
                        sx={{
                          "&:hover": { bgcolor: "#F8FAFC" },
                          bgcolor:
                            rank <= 3
                              ? `${medalColors[rank - 1]}08`
                              : "transparent",
                          cursor: driver ? "pointer" : "default",
                          transition: "background 0.2s",
                        }}
                        onClick={() => driver && handleOpenDetail(driver)}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 32,
                              height: 32,
                              borderRadius: "10px",
                              bgcolor:
                                rank <= 3
                                  ? `${medalColors[rank - 1]}20`
                                  : "#F1F5F9",
                              fontWeight: 900,
                              fontSize: "0.85rem",
                              color:
                                rank <= 3 ? medalColors[rank - 1] : "#64748B",
                            }}
                          >
                            {rank <= 3 ? (
                              <EmojiEventsTwoTone
                                sx={{
                                  fontSize: 18,
                                  color: medalColors[rank - 1],
                                }}
                              />
                            ) : (
                              rank
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Avatar
                              src={stat.photoUrl}
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "10px",
                                bgcolor: "#F5F3FF",
                                color: "#7C3AED",
                                fontWeight: 800,
                                fontSize: "0.9rem",
                              }}
                            >
                              {stat.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.9rem",
                                  color: "#0F172A",
                                }}
                              >
                                {stat.name}
                              </Typography>
                              {stat.mobile && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    mt: 0.2,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: "0.72rem",
                                      color: "#64748B",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {stat.mobile}
                                  </Typography>
                                  <Tooltip
                                    title={`Call ${stat.name} (${stat.mobile})`}
                                  >
                                    <IconButton
                                      component="a"
                                      href={`tel:${stat.mobile}`}
                                      onClick={(e) => e.stopPropagation()}
                                      size="small"
                                      sx={{
                                        color: "#16A34A",
                                        bgcolor: "#DCFCE7",
                                        "&:hover": {
                                          bgcolor: "#16A34A",
                                          color: "#fff",
                                        },
                                      }}
                                    >
                                      <PhoneTwoTone sx={{ fontSize: 12 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "#475569",
                          }}
                        >
                          {stat.entryCount}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, fontSize: "0.85rem" }}
                        >
                          {stat.totalKm?.toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "#475569",
                          }}
                        >
                          {stat.totalLitres?.toLocaleString("en-IN", {
                            maximumFractionDigits: 1,
                          })}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 900,
                            fontSize: "0.95rem",
                            color: STATUS_CONFIG[status]?.text || "#0F172A",
                          }}
                        >
                          {stat.avgKmPerLitre?.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          {status && (
                            <Chip
                              label={STATUS_CONFIG[status].label}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                bgcolor: STATUS_CONFIG[status].bg,
                                color: STATUS_CONFIG[status].text,
                                borderRadius: "6px",
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      ) : (
        /* ── CARDS VIEW ── */
        <Grid container spacing={3.5}>
          {filteredDrivers.map((driver, index) => {
            const stats = getDriverStats(driver._id);
            const status = stats
              ? determineDriverStatus(stats.avgKmPerLitre, busStats)
              : null;
            return (
              <Grid
                size={{ xs: 12, md: 6, lg: 4 }}
                key={driver._id}
                sx={{ display: "flex" }}
              >
                <Zoom
                  in
                  style={{ transitionDelay: `${index * 80}ms`, width: "100%" }}
                >
                  <Paper
                    elevation={0}
                    onClick={() => handleOpenDetail(driver)}
                    sx={{
                      borderRadius: "24px",
                      border: "1px solid #F1F5F9",
                      bgcolor: "rgba(255, 255, 255, 0.8)",
                      backdropFilter: "blur(20px)",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      "&:hover": {
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
                        border: "1px solid #E2E8F0",
                        transform: "translateY(-2px)",
                        "& .driver-actions": { opacity: 1 },
                      },
                    }}
                  >
                    {/* Card Header with Photo */}
                    <Box
                      sx={{
                        p: 3,
                        pb: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                          flex: 1,
                          minWidth: 0,
                          mr: 1,
                        }}
                      >
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          badgeContent={
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                bgcolor: getLicenseBadgeColor(
                                  driver.licenseExpiryDate,
                                ),
                                border: "2px solid white",
                              }}
                            />
                          }
                        >
                          <Avatar
                            src={driver.photoUrl}
                            alt={driver.name}
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: "16px",
                              bgcolor: "#F5F3FF",
                              color: "#7C3AED",
                              fontWeight: 800,
                              fontSize: "1.3rem",
                              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)",
                            }}
                          >
                            {driver.name?.charAt(0)?.toUpperCase() || "D"}
                          </Avatar>
                        </Badge>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 800,
                                color: "#0F172A",
                                mb: 0.3,
                              }}
                            >
                              {driver.name}
                            </Typography>
                            {status && (
                              <Chip
                                label={STATUS_CONFIG[status].label}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.6rem",
                                  fontWeight: 800,
                                  bgcolor: STATUS_CONFIG[status].bg,
                                  color: STATUS_CONFIG[status].text,
                                  borderRadius: "6px",
                                }}
                              />
                            )}
                          </Box>
                          {driver.mobile && (
                            <Tooltip title={`Call ${driver.mobile}`}>
                              <Button
                                component="a"
                                href={`tel:${driver.mobile}`}
                                onClick={(e) => e.stopPropagation()}
                                size="small"
                                startIcon={
                                  <PhoneTwoTone
                                    sx={{ fontSize: "14px !important" }}
                                  />
                                }
                                sx={{
                                  mt: 0.6,
                                  bgcolor: "#ECFDF5",
                                  color: "#047857",
                                  border: "1px solid #A7F3D0",
                                  borderRadius: "10px",
                                  px: 1.5,
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  textTransform: "none",
                                  boxShadow:
                                    "0 2px 6px rgba(16, 185, 129, 0.08)",
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    bgcolor: "#059669",
                                    color: "#ffffff",
                                    borderColor: "#059669",
                                    boxShadow:
                                      "0 4px 14px rgba(5, 150, 105, 0.25)",
                                  },
                                }}
                              >
                                Call Driver
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      <Box
                        className="driver-actions"
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
                        <Tooltip title="Edit Driver">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(driver);
                            }}
                            sx={{
                              color: "#8B5CF6",
                              "&:hover": { bgcolor: "#F5F3FF" },
                            }}
                          >
                            <EditTwoTone fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Driver">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(driver._id);
                            }}
                            sx={{
                              color: "#EF4444",
                              "&:hover": { bgcolor: "#FEF2F2" },
                            }}
                          >
                            <DeleteTwoTone fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Performance Stats */}
                    <Box sx={{ px: 3, mb: 3, flexGrow: 1 }}>
                      <Grid container spacing={2}>
                        {stats ? (
                          <>
                            <Grid size={{ xs: 4 }}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: "14px",
                                  bgcolor: "#EFF6FF",
                                  textAlign: "center",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "0.6rem",
                                    color: "#3B82F6",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Total KM
                                </Typography>
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: "1rem",
                                    color: "#1E40AF",
                                  }}
                                >
                                  {stats.totalKm >= 1000
                                    ? `${(stats.totalKm / 1000).toFixed(1)}k`
                                    : stats.totalKm?.toLocaleString("en-IN", {
                                        maximumFractionDigits: 0,
                                      })}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: "14px",
                                  bgcolor: status
                                    ? STATUS_CONFIG[status].bg
                                    : "#F0FDF4",
                                  textAlign: "center",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "0.6rem",
                                    color: status
                                      ? STATUS_CONFIG[status].text
                                      : "#16A34A",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Avg km/L
                                </Typography>
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: "1rem",
                                    color: status
                                      ? STATUS_CONFIG[status].text
                                      : "#166534",
                                  }}
                                >
                                  {stats.avgKmPerLitre?.toFixed(2)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: "14px",
                                  bgcolor: "#F5F3FF",
                                  textAlign: "center",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "0.6rem",
                                    color: "#7C3AED",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Fill-ups
                                </Typography>
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: "1rem",
                                    color: "#5B21B6",
                                  }}
                                >
                                  {stats.entryCount}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        ) : (
                          <Grid size={{ xs: 12 }}>
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: "14px",
                                bgcolor: "#F8FAFC",
                                textAlign: "center",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.8rem",
                                  color: "#94A3B8",
                                  fontWeight: 600,
                                }}
                              >
                                No fuel data for this period
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>

                    {/* Assigned Bus Info */}
                    {driver.assignedBusId && (
                      <Box sx={{ px: 3, mb: 2.5 }}>
                        <Chip
                          icon={
                            <DirectionsBusTwoTone
                              sx={{ fontSize: 14, color: "#2563EB" }}
                            />
                          }
                          label={`Bus: ${driver.assignedBusId.numberPlate} — ${driver.assignedBusId.modelName}`}
                          size="small"
                          sx={{
                            width: "100%",
                            justifyContent: "flex-start",
                            bgcolor: "#EFF6FF",
                            color: "#1E40AF",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            py: 1.8,
                            px: 1,
                            borderRadius: "12px",
                            border: "1px solid #BFDBFE",
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </Box>
                    )}

                    {/* License Info Footer */}
                    <Box
                      sx={{
                        px: 3,
                        py: 2,
                        bgcolor: "#F1F5F9",
                        borderTop: "1px solid #E2E8F0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <BadgeTwoTone sx={{ fontSize: 16, color: "#94A3B8" }} />
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#64748B",
                            fontFamily: "monospace",
                          }}
                        >
                          {driver.licenseNumber}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          isLicenseExpired(driver.licenseExpiryDate)
                            ? "Expired"
                            : isLicenseExpiringSoon(driver.licenseExpiryDate)
                              ? "Expiring Soon"
                              : "Valid"
                        }
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.6rem",
                          fontWeight: 800,
                          bgcolor: isLicenseExpired(driver.licenseExpiryDate)
                            ? "#FEE2E2"
                            : isLicenseExpiringSoon(driver.licenseExpiryDate)
                              ? "#FEF3C7"
                              : "#DCFCE7",
                          color: isLicenseExpired(driver.licenseExpiryDate)
                            ? "#991B1B"
                            : isLicenseExpiringSoon(driver.licenseExpiryDate)
                              ? "#92400E"
                              : "#166534",
                        }}
                      />
                    </Box>
                  </Paper>
                </Zoom>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Driver Detail Dialog ── */}
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
        {detailDriver && (
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
                <Avatar
                  src={detailDriver.photoUrl}
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "16px",
                    bgcolor: "#F5F3FF",
                    color: "#7C3AED",
                    fontWeight: 800,
                    fontSize: "1.5rem",
                  }}
                >
                  {detailDriver.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 900, color: "#0F172A" }}
                    >
                      {detailDriver.name}
                    </Typography>
                    {(() => {
                      const s = getDriverStats(detailDriver._id);
                      const status = s
                        ? determineDriverStatus(s.avgKmPerLitre, busStats)
                        : null;
                      return status ? (
                        <Chip
                          label={STATUS_CONFIG[status].label}
                          size="small"
                          sx={{
                            height: 22,
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            bgcolor: STATUS_CONFIG[status].bg,
                            color: STATUS_CONFIG[status].text,
                            borderRadius: "6px",
                          }}
                        />
                      ) : null;
                    })()}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      flexWrap: "wrap",
                      mt: 0.2,
                    }}
                  >
                    <Typography sx={{ fontSize: "0.85rem", color: "#64748B" }}>
                      {detailDriver.mobile} · License:{" "}
                      {detailDriver.licenseNumber}
                    </Typography>
                    {detailDriver.mobile && (
                      <Button
                        component="a"
                        href={`tel:${detailDriver.mobile}`}
                        startIcon={<PhoneTwoTone />}
                        size="small"
                        variant="contained"
                        disableElevation
                        sx={{
                          bgcolor: "#16A34A",
                          color: "#fff",
                          borderRadius: "8px",
                          fontWeight: 700,
                          textTransform: "none",
                          fontSize: "0.75rem",
                          px: 1.5,
                          "&:hover": { bgcolor: "#15803D" },
                        }}
                      >
                        Call Driver
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
              <IconButton onClick={() => setDetailOpen(false)}>
                <CloseTwoTone />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              {/* Summary Stats */}
              {(() => {
                const s = getDriverStats(detailDriver._id);
                if (!s) return null;
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
                          sx={{
                            fontWeight: 900,
                            fontSize: "1.3rem",
                            color: "#1E40AF",
                          }}
                        >
                          {s.totalKm?.toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                          })}
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
                          sx={{
                            fontWeight: 900,
                            fontSize: "1.3rem",
                            color: "#166534",
                          }}
                        >
                          {s.avgKmPerLitre?.toFixed(2)}
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
                          sx={{
                            fontWeight: 900,
                            fontSize: "1.3rem",
                            color: "#5B21B6",
                          }}
                        >
                          {s.totalLitres?.toLocaleString("en-IN", {
                            maximumFractionDigits: 1,
                          })}
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
                          Fill-ups
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            fontSize: "1.3rem",
                            color: "#065F46",
                          }}
                        >
                          {s.entryCount}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                );
              })()}

              {/* Bus Breakdown */}
              {detailBusBreakdown.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <DirectionsBusTwoTone sx={{ fontSize: 18 }} />
                    Performance by Bus
                  </Typography>
                  <Grid container spacing={1.5}>
                    {detailBusBreakdown.map((b) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={b.busId}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: "14px",
                            border: "1px solid #F1F5F9",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                color: "#0F172A",
                              }}
                            >
                              {b.numberPlate}
                            </Typography>
                            <Typography
                              sx={{ fontSize: "0.7rem", color: "#94A3B8" }}
                            >
                              {b.modelName} · {b.entryCount} entries
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography
                              sx={{
                                fontWeight: 900,
                                fontSize: "1rem",
                                color: "#0F172A",
                              }}
                            >
                              {b.avgKmPerLitre.toFixed(2)}
                              <Box
                                component="span"
                                sx={{
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                  ml: 0.3,
                                  color: "#64748B",
                                }}
                              >
                                km/L
                              </Box>
                            </Typography>
                            <Typography
                              sx={{ fontSize: "0.7rem", color: "#64748B" }}
                            >
                              {b.totalKm.toLocaleString("en-IN", {
                                maximumFractionDigits: 0,
                              })}{" "}
                              km
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Fuel History Table */}
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
                All-Time Driving History ({detailEntries.length} entries)
              </Typography>

              {detailLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress size={36} sx={{ color: "#7C3AED" }} />
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
                    No fuel entries found for this driver.
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
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            color: "#475569",
                          }}
                        >
                          Date
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            color: "#475569",
                          }}
                        >
                          Receipt
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            color: "#475569",
                          }}
                        >
                          Bus
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            color: "#475569",
                          }}
                        >
                          KM
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            color: "#475569",
                          }}
                        >
                          Litres
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            color: "#475569",
                          }}
                        >
                          km/L
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            color: "#475569",
                          }}
                        >
                          Cost (₹)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailEntries.map((entry) => {
                        const sc = STATUS_CONFIG[entry.status];
                        return (
                          <TableRow
                            key={entry._id}
                            sx={{ "&:hover": { bgcolor: "#F8FAFC" } }}
                          >
                            <TableCell
                              sx={{ fontWeight: 600, fontSize: "0.8rem" }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                {new Date(entry.date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "2-digit",
                                  },
                                )}
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
                            <TableCell
                              sx={{ fontWeight: 600, fontSize: "0.8rem" }}
                            >
                              {entry.busId?.numberPlate || "—"}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                            >
                              {entry.kmTravelled?.toLocaleString() || "—"}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                            >
                              {entry.litresFilled}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.8rem",
                                color: sc?.text || "#475569",
                              }}
                            >
                              {entry.averageKmPerLitre
                                ? entry.averageKmPerLitre.toFixed(2)
                                : "—"}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                            >
                              {entry.fuelCost
                                ? `₹${entry.fuelCost.toLocaleString()}`
                                : "—"}
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
                bgcolor: "#F5F3FF",
                color: "#7C3AED",
                display: "flex",
              }}
            >
              <PersonTwoTone />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E293B" }}>
              {isEditing ? "Edit Driver Details" : "Register New Driver"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#64748B", mb: 3, fontWeight: 500 }}
            >
              Fill in the driver's personal, license, and banking information.
            </Typography>

            {/* Photo Upload */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <Avatar
                  src={pendingPhotoBase64 || undefined}
                  sx={{
                    width: 88,
                    height: 88,
                    borderRadius: "20px",
                    bgcolor: "#F5F3FF",
                    color: "#7C3AED",
                    fontWeight: 800,
                    fontSize: "2rem",
                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)",
                  }}
                >
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "D"}
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoSelect}
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    bgcolor: "#7C3AED",
                    color: "white",
                    width: 32,
                    height: 32,
                    "&:hover": { bgcolor: "#6D28D9" },
                    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.4)",
                  }}
                >
                  <CameraAltTwoTone sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>

            {pendingPhotoBase64 && (
              <Chip
                label="Photo ready — will be uploaded on save"
                size="small"
                onDelete={() => setPendingPhotoBase64(null)}
                sx={{
                  mb: 2,
                  mx: "auto",
                  display: "flex",
                  width: "fit-content",
                  bgcolor: "#DCFCE7",
                  color: "#166534",
                  fontWeight: 600,
                  borderRadius: "8px",
                }}
              />
            )}

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Driver Name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <PersonTwoTone
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
                  label="Mobile Number"
                  placeholder="10-digit number"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <PhoneTwoTone
                        sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }}>
                  <Chip
                    label="LICENSE DETAILS"
                    size="small"
                    sx={{
                      fontSize: "0.65rem",
                      fontWeight: 750,
                      color: "#64748B",
                      bgcolor: "#F1F5F9",
                      px: 1,
                    }}
                  />
                </Divider>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel
                  sx={{
                    mb: 0.5,
                    fontSize: "0.75rem",
                    color: "#64748B",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  License Number
                </InputLabel>
                <TextField
                  fullWidth
                  required
                  placeholder="e.g. GJ01 20240000001"
                  value={formData.licenseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseNumber: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <BadgeTwoTone
                        sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InputLabel
                  sx={{
                    mb: 0.5,
                    fontSize: "0.75rem",
                    color: "#64748B",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  License Expiry Date
                </InputLabel>
                <TextField
                  fullWidth
                  required
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.licenseExpiryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      licenseExpiryDate: e.target.value,
                    })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <CalendarTodayTwoTone
                        sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }}>
                  <Chip
                    label="BANK DETAILS (OPTIONAL)"
                    size="small"
                    sx={{
                      fontSize: "0.65rem",
                      fontWeight: 750,
                      color: "#64748B",
                      bgcolor: "#F1F5F9",
                      px: 1,
                    }}
                  />
                </Divider>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Bank Account Number"
                  placeholder="Account number"
                  value={formData.bankAccountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankAccountNumber: e.target.value,
                    })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <CreditCardTwoTone
                        sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  placeholder="e.g. SBIN0001234"
                  value={formData.ifscCode}
                  onChange={(e) =>
                    setFormData({ ...formData, ifscCode: e.target.value })
                  }
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <AccountBalanceTwoTone
                        sx={{ mr: 1, color: "#94A3B8", fontSize: 20 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={buses}
                  getOptionLabel={(option) =>
                    `${option.numberPlate} (${option.modelName})`
                  }
                  value={
                    buses.find((b) => b._id === formData.assignedBusId) || null
                  }
                  onChange={(_, newValue) =>
                    setFormData({
                      ...formData,
                      assignedBusId: newValue ? newValue._id : null,
                    })
                  }
                  isOptionEqualToValue={(option, value) =>
                    option._id === value._id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assigned Bus (Optional)"
                      placeholder="Select default bus for this driver"
                      InputProps={{
                        ...(params?.InputProps || {}),
                        sx: { borderRadius: "12px" },
                        startAdornment: (
                          <>
                            <DirectionsBusTwoTone
                              sx={{
                                mr: 1,
                                ml: 1,
                                color: "#94A3B8",
                                fontSize: 20,
                              }}
                            />
                            {params?.InputProps?.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
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
                bgcolor: "#1E293B",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "12px",
                px: 4,
                py: 1,
                transition: "all 0.3s ease",
                boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)",
                "&:hover": {
                  bgcolor: "#0F172A",
                  transform: "translateY(-2px)",
                  boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.2)",
                },
              }}
            >
              {isEditing ? "Update Driver" : "Register Driver"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropOpen}
        imageSrc={photoSrc}
        onClose={() => setCropOpen(false)}
        onComplete={handleCropComplete}
      />
    </Box>
  );
}
