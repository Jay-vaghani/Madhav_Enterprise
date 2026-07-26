import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  InputLabel,
  Divider,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  AccessTime as TimeIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  CalendarTodayTwoTone,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  fetchAllShifts,
  createShift,
  updateShift,
  deleteShift,
  fetchAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchAllPickupPoints,
  createPickupPoint,
  updatePickupPoint,
  deletePickupPoint,
} from "../../../api/admin/api";

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

// Generate ID from label (lowercase, remove special chars, replace spaces with hyphen)
const generateId = (label) => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// Format time from 24h to 12h format (e.g., "09:30" → "9:30 AM")
const formatTime12h = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

const SettingsPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Data states
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState("shift");
  
  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("");

  // Form states
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered lists (frontend-only search)
  const q = searchQuery.trim().toLowerCase();
  const filteredShifts = useMemo(
    () =>
      q
        ? shifts.filter(
            (s) =>
              s.label?.toLowerCase().includes(q) ||
              s.time?.toLowerCase().includes(q) ||
              s.emoji?.toLowerCase().includes(q),
          )
        : shifts,
    [shifts, q],
  );
  const filteredDepartments = useMemo(
    () =>
      q
        ? departments.filter(
            (d) =>
              d.label?.toLowerCase().includes(q) ||
              d.id?.toLowerCase().includes(q),
          )
        : departments,
    [departments, q],
  );
  const filteredPickupPoints = useMemo(
    () =>
      q
        ? pickupPoints.filter(
            (p) =>
              p.label?.toLowerCase().includes(q) ||
              String(p.fee || "").includes(q),
          )
        : pickupPoints,
    [pickupPoints, q],
  );

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, deptsRes, pointsRes] = await Promise.all([
        fetchAllShifts(token),
        fetchAllDepartments(token),
        fetchAllPickupPoints(token),
      ]);

      if (shiftsRes.success) setShifts(shiftsRes.shifts);
      if (deptsRes.success) setDepartments(deptsRes.departments);
      if (pointsRes.success) setPickupPoints(pointsRes.pickupPoints);
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchQuery("");
  };

  // ═══════════════════════════════════════════════════════════════
  // Dialog Handlers
  // ═══════════════════════════════════════════════════════════════

  const handleOpenCreateDialog = (type) => {
    setItemType(type);
    setDialogMode("create");
    setFormErrors({});

    if (type === "shift") {
      setFormData({ label: "", time: "", emoji: "🚌", isActive: true });
    } else if (type === "department") {
      setFormData({ label: "", defaultShift: null, isActive: true, validityPresets: {} });
    } else {
      setFormData({ label: "", fee: "", isActive: true });
    }

    setSelectedItem(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (type, item) => {
    setItemType(type);
    setDialogMode("edit");
    setFormErrors({});
    setSelectedItem(item);
    
    // For department, find the shift object if defaultShift is a string
    if (type === "department" && item.defaultShift) {
      const shiftObj = shifts.find(s => s.id === item.defaultShift || s.time === item.defaultShift || s.label === item.defaultShift);
      setFormData({ ...item, defaultShift: shiftObj || item.defaultShift, validityPresets: item.validityPresets || {} });
    } else {
      setFormData({ ...item, validityPresets: item.validityPresets || {} });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormErrors({});
  };

  // ═══════════════════════════════════════════════════════════════
  // Form Validation & Submit
  // ═══════════════════════════════════════════════════════════════

  const validateForm = () => {
    const errors = {};

    if (!formData.label?.trim()) {
      errors.label = "Label is required";
    }

    if (itemType === "shift") {
      if (!formData.time) {
        errors.time = "Time is required";
      }
    }

    if (itemType === "pickupPoint") {
      if (!formData.fee || formData.fee < 0) {
        errors.fee = "Valid fee is required";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Generate ID from label for new items
      const payload = {
        ...formData,
        id: dialogMode === "create" ? generateId(formData.label) : formData.id,
      };

      // For department, convert defaultShift object to shift ID string
      if (itemType === "department" && payload.defaultShift) {
        payload.defaultShift = typeof payload.defaultShift === 'object' 
          ? (payload.defaultShift.id || payload.defaultShift.label)
          : payload.defaultShift;
      }

      if (itemType === "shift") {
        if (dialogMode === "create") {
          const res = await createShift(token, payload);
          if (res.success) {
            showSnackbar("Shift created successfully!");
            setShifts([...shifts, res.shift]);
          }
        } else {
          const res = await updateShift(token, selectedItem.id, payload);
          if (res.success) {
            showSnackbar("Shift updated successfully!");
            setShifts(shifts.map((s) => (s.id === res.shift.id ? res.shift : s)));
          }
        }
      } else if (itemType === "department") {
        if (dialogMode === "create") {
          const res = await createDepartment(token, payload);
          if (res.success) {
            showSnackbar("Department created successfully!");
            setDepartments([...departments, res.department]);
          }
        } else {
          const res = await updateDepartment(token, selectedItem.id, payload);
          if (res.success) {
            showSnackbar("Department updated successfully!");
            setDepartments(departments.map((d) => (d.id === res.department.id ? res.department : d)));
          }
        }
      } else if (itemType === "pickupPoint") {
        if (dialogMode === "create") {
          const res = await createPickupPoint(token, payload);
          if (res.success) {
            showSnackbar("Pickup point created successfully!");
            setPickupPoints([...pickupPoints, res.pickupPoint]);
          }
        } else {
          const res = await updatePickupPoint(token, selectedItem.id, payload);
          if (res.success) {
            showSnackbar("Pickup point updated successfully!");
            setPickupPoints(pickupPoints.map((p) => (p.id === res.pickupPoint.id ? res.pickupPoint : p)));
          }
        }
      }

      handleCloseDialog();
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (type, item) => {
    setDeleteType(type);
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setSubmitting(true);
    try {
      if (deleteType === "shift") {
        const res = await deleteShift(token, itemToDelete.id);
        if (res.success) {
          showSnackbar("Shift deleted successfully!");
          setShifts(shifts.filter((s) => s.id !== itemToDelete.id));
        }
      } else if (deleteType === "department") {
        const res = await deleteDepartment(token, itemToDelete.id);
        if (res.success) {
          showSnackbar("Department deleted successfully!");
          setDepartments(departments.filter((d) => d.id !== itemToDelete.id));
        }
      } else if (deleteType === "pickupPoint") {
        const res = await deletePickupPoint(token, itemToDelete.id);
        if (res.success) {
          showSnackbar("Pickup point deleted successfully!");
          setPickupPoints(pickupPoints.filter((p) => p.id !== itemToDelete.id));
        }
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Render Cards
  // ═══════════════════════════════════════════════════════════════

  const renderShiftsCards = (items = shifts) => (
    <Grid container spacing={2}>
      {items.length === 0 ? (
        <Grid size={12}>
          <Box sx={{ textAlign: "center", py: 6, color: "#64748B" }}>
            <ScheduleIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
            <Typography>No shifts found. Create one to get started.</Typography>
          </Box>
        </Grid>
      ) : (
        items.map((shift) => (
          <Grid key={shift.id} size={{ xs: 12, sm: 6, md: 4, }}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                transition: "all 0.2s",
                opacity: shift.isActive ? 1 : 0.6,
                "&:hover": {
                  boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: shift.isActive ? "#EFF6FF" : "#F1F5F9",
                      color: shift.isActive ? "#2563EB" : "#94A3B8",
                      fontSize: "1.5rem",
                      width: 48,
                      height: 48,
                    }}
                  >
                    {shift.emoji}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "#1E293B",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {shift.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime12h(shift.time)}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Chip
                    label={shift.isActive ? "Active" : "Inactive"}
                    color={shift.isActive ? "success" : "default"}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                  />
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog("shift", shift)}
                        sx={{ color: "#2563EB" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog("shift", shift)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  const renderDepartmentsCards = (items = departments) => (
    <Grid container spacing={2}>
      {items.length === 0 ? (
        <Grid size={12}>
          <Box sx={{ textAlign: "center", py: 6, color: "#64748B" }}>
            <SchoolIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
            <Typography>No departments found. Create one to get started.</Typography>
          </Box>
        </Grid>
      ) : (
        items.map((dept) => (
          <Grid key={dept.id} size={{ xs: 12, sm: 6, md: 4, }}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                transition: "all 0.2s",
                opacity: dept.isActive ? 1 : 0.6,
                "&:hover": {
                  boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: dept.isActive ? "#F0FDF4" : "#F1F5F9",
                      color: dept.isActive ? "#16A34A" : "#94A3B8",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <SchoolIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "#1E293B",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {dept.label}
                    </Typography>
                    {dept.defaultShift && (() => {
                      const s = shifts.find(sh => sh.id === dept.defaultShift || sh.time === dept.defaultShift || sh.label === dept.defaultShift);
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Default: {s ? `${s.emoji || "🚌"} ${s.label}` : dept.defaultShift}
                        </Typography>
                      );
                    })()}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Chip
                    label={dept.isActive ? "Active" : "Inactive"}
                    color={dept.isActive ? "success" : "default"}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                  />
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog("department", dept)}
                        sx={{ color: "#2563EB" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog("department", dept)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  const renderPickupPointsCards = (items = pickupPoints) => (
    <Grid container spacing={2}>
      {items.length === 0 ? (
        <Grid size={12}>
          <Box sx={{ textAlign: "center", py: 6, color: "#64748B" }}>
            <LocationIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
            <Typography>No pickup points found. Create one to get started.</Typography>
          </Box>
        </Grid>
      ) : (
        items.map((point) => (
          <Grid key={point.id} size={{ xs: 12, sm: 6, md: 4}}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                transition: "all 0.2s",
                opacity: point.isActive ? 1 : 0.6,
                "&:hover": {
                  boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: point.isActive ? "#FEF3C7" : "#F1F5F9",
                      color: point.isActive ? "#D97706" : "#94A3B8",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <LocationIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "#1E293B",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {point.label}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, color: "#2563EB", mt: 0.5 }}
                    >
                      ₹{Number(point.fee).toLocaleString("en-IN")}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Chip
                    label={point.isActive ? "Active" : "Inactive"}
                    color={point.isActive ? "success" : "default"}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                  />
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog("pickupPoint", point)}
                        sx={{ color: "#2563EB" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog("pickupPoint", point)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  // ═══════════════════════════════════════════════════════════════
  // Render Dialog Content
  // ═══════════════════════════════════════════════════════════════

  const renderDialogContent = () => {
    const isEdit = dialogMode === "edit";
    const sharedInputSx = {
      "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        bgcolor: "#F8FAFC",
        transition: "all 0.2s",
        "&:hover": { bgcolor: "#F1F5F9" },
        "&.Mui-focused": {
          bgcolor: "#FFFFFF",
          boxShadow: `0 0 0 3px ${
            itemType === "shift" ? "rgba(37,99,235,0.1)" :
            itemType === "department" ? "rgba(22,163,74,0.1)" :
            "rgba(217,119,6,0.1)"
          }`,
        },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: itemType === "shift" ? "#2563EB" :
                      itemType === "department" ? "#16A34A" :
                      "#D97706",
        },
      },
    };

    return (
      <Box sx={{ pt: 1 }}>
        {/* Label - Common for all types */}
        <InputLabel sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.82rem", mb: 0.75 }}>
          Name *
        </InputLabel>
        <TextField
          fullWidth
          placeholder={
            itemType === "shift"
              ? "e.g., Morning Shift"
              : itemType === "department"
              ? "e.g., B.Tech Computer Science"
              : "e.g., Central Bus Stand"
          }
          value={formData.label || ""}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          error={!!formErrors.label}
          helperText={formErrors.label || ""}
          sx={{ mb: 3, ...sharedInputSx }}
        />

        {itemType === "shift" && (
          <>
            <InputLabel sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.82rem", mb: 0.75 }}>
              Time *
            </InputLabel>
            <TextField
              fullWidth
              type="time"
              value={formData.time || ""}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              error={!!formErrors.time}
              sx={{ mb: formData.time ? 1 : 3, ...sharedInputSx }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TimeIcon sx={{ color: "#64748B" }} />
                  </InputAdornment>
                ),
              }}
            />
            {formData.time && (
              <Chip
                size="small"
                icon={<ScheduleIcon sx={{ fontSize: "14px !important" }} />}
                label={formatTime12h(formData.time)}
                sx={{
                  mb: 2.5,
                  bgcolor: "#EFF6FF",
                  color: "#2563EB",
                  fontWeight: 700,
                  borderRadius: "8px",
                }}
              />
            )}
            <InputLabel sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.82rem", mb: 0.75 }}>
              Emoji
            </InputLabel>
            <TextField
              fullWidth
              value={formData.emoji || ""}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              helperText="Pick an icon for this shift"
              sx={{ mb: 2, ...sharedInputSx }}
              inputProps={{ maxLength: 2 }}
            />
          </>
        )}

        {itemType === "department" && (
          <>
            <InputLabel sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.82rem", mb: 0.75 }}>
              Default Shift
            </InputLabel>
            <Autocomplete
              options={shifts}
              value={formData.defaultShift || null}
              getOptionLabel={(option) => {
                if (!option) return "";
                return `${option.emoji || "🚌"} ${option.label} (${formatTime12h(option.time)})`;
              }}
              onChange={(e, selected) => setFormData({ ...formData, defaultShift: selected })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search shifts…"
                  sx={{ mb: 3, ...sharedInputSx }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
                  <Box sx={{ fontSize: "1.2rem" }}>{option.emoji || "🚌"}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#1E293B" }}>
                      {option.label}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={formatTime12h(option.time)}
                    sx={{
                      bgcolor: "#F1F5F9",
                      color: "#475569",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      borderRadius: "6px",
                    }}
                  />
                </Box>
              )}
            />
          </>
        )}

        {/* Validity Date Presets — Department only */}
        {itemType === "department" && (
          <Box
            sx={{
              mt: 1,
              p: 2.5,
              borderRadius: "18px",
              bgcolor: "#F0FDF4",
              border: "1px solid #BBF7D0",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <CalendarTodayTwoTone sx={{ fontSize: 16, color: "#16A34A" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Validity Date Presets
              </Typography>
              <Chip
                size="small"
                label="Optional"
                sx={{
                  ml: "auto",
                  bgcolor: "#DCFCE7",
                  color: "#166534",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  borderRadius: "6px",
                  height: "20px",
                }}
              />
            </Box>
            <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 2 }}>
              Set default validity expiry dates per year. Matching chips glow during verification.
            </Typography>
            <Grid container spacing={1.5}>
              {[
                { value: "1", label: "First Year", color: "#3B82F6" },
                { value: "2", label: "Second Year", color: "#8B5CF6" },
                { value: "3", label: "Third Year", color: "#EC4899" },
                { value: "4", label: "Fourth Year", color: "#F59E0B" },
              ].map((yr) => (
                <Grid size={{ xs: 6 }} key={yr.value}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      bgcolor: "white",
                      border: "1px solid #E2E8F0",
                      transition: "all 0.2s",
                      "&:hover": { borderColor: yr.color, boxShadow: `0 2px 8px ${yr.color}15` },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: yr.color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: "#1E293B" }}>
                        {yr.label}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      type="date"
                      size="small"
                      value={formData.validityPresets?.[yr.value] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          validityPresets: {
                            ...(formData.validityPresets || {}),
                            [yr.value]: e.target.value,
                          },
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        sx: {
                          borderRadius: "10px",
                          fontSize: "0.82rem",
                          bgcolor: "#F8FAFC",
                        },
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {itemType === "pickupPoint" && (
          <TextField
            fullWidth
            label="Fee (₹)"
            type="tel"
            inputMode="numeric"
            placeholder="e.g., 8800"
            value={formData.fee || ""}
            onChange={(e) => {
              // Only allow numbers
              const value = e.target.value.replace(/[^0-9]/g, "");
              setFormData({ ...formData, fee: value });
            }}
            error={!!formErrors.fee}
            helperText={formErrors.fee || "Transport fee for this pickup point"}
            sx={{ mb: 3, ...sharedInputSx }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontWeight: 700, color: "#64748B" }}>₹</Typography>
                </InputAdornment>
              ),
            }}
          />
        )}

        <FormControlLabel
          control={
            <Switch
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              color="success"
            />
          }
          label={
            <Typography sx={{ fontWeight: 500, color: "#374151" }}>
              {formData.isActive ? "Active (visible to users)" : "Inactive (hidden from users)"}
            </Typography>
          }
        />
      </Box>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#1E293B", mb: 0.5, fontSize: { xs: "1.5rem", md: "2rem" } }}
          >
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage shifts, departments, and pickup points
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAllData}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder={`Search ${activeTab === 0 ? "shifts" : activeTab === 1 ? "departments" : "pickup points"}…`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
            </InputAdornment>
          ),
          endAdornment: searchQuery ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ color: "#94A3B8" }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: { borderRadius: "12px", bgcolor: "white", fontSize: "0.9rem" },
        }}
        sx={{ mb: 2 }}
      />

      {/* Tabs */}
      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          border: "1px solid #E2E8F0",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "#F8FAFC",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              py: 2,
              px: { xs: 2, md: 4 },
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            },
          }}
        >
          <Tab
            icon={<TimeIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label={`Shifts (${filteredShifts.length}${q ? `/${shifts.length}` : ""})`}
          />
          <Tab
            icon={<SchoolIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label={`Departments (${filteredDepartments.length}${q ? `/${departments.length}` : ""})`}
          />
          <Tab
            icon={<LocationIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label={`Pickup Points (${filteredPickupPoints.length}${q ? `/${pickupPoints.length}` : ""})`}
          />
        </Tabs>

        {/* Shifts Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCreateDialog("shift")}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#2563EB",
              "&:hover": { bgcolor: "#1D4ED8" },
            }}
          >
            Add Shift
          </Button>
          </Box>
          {renderShiftsCards(filteredShifts)}
        </TabPanel>

        {/* Departments Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenCreateDialog("department")}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#16A34A",
                "&:hover": { bgcolor: "#15803D" },
              }}
            >
              Add Department
            </Button>
          </Box>
          {renderDepartmentsCards(filteredDepartments)}
        </TabPanel>

        {/* Pickup Points Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenCreateDialog("pickupPoint")}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#D97706",
                "&:hover": { bgcolor: "#B45309" },
              }}
            >
              Add Pickup Point
            </Button>
          </Box>
          {renderPickupPointsCards(filteredPickupPoints)}
        </TabPanel>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 0,
            m: 0,
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2.5,
              display: "flex",
              alignItems: "center",
              gap: 2,
              background:
                itemType === "shift"
                  ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)"
                  : itemType === "department"
                  ? "linear-gradient(135deg, #16A34A 0%, #15803D 100%)"
                  : "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
              color: "white",
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                bgcolor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
              }}
            >
              {itemType === "shift" ? (
                <TimeIcon sx={{ fontSize: 22 }} />
              ) : itemType === "department" ? (
                <SchoolIcon sx={{ fontSize: 22 }} />
              ) : (
                <LocationIcon sx={{ fontSize: 22 }} />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2 }}>
                {dialogMode === "create" ? "Create" : "Edit"}{" "}
                {itemType === "pickupPoint" ? "Pickup Point" : itemType === "department" ? "Department" : "Shift"}
              </Typography>
              {dialogMode === "edit" && selectedItem?.label && (
                <Typography sx={{ fontSize: "0.75rem", opacity: 0.85, fontWeight: 500 }}>
                  {selectedItem.label}
                </Typography>
              )}
            </Box>
            <IconButton
              onClick={handleCloseDialog}
              size="small"
              sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3 }}>{renderDialogContent()}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={submitting}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#64748B",
              borderRadius: "12px",
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} sx={{ color: "white" }} /> : null}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "12px",
              px: 4,
              py: 1.2,
              bgcolor:
                itemType === "shift"
                  ? "#2563EB"
                  : itemType === "department"
                  ? "#16A34A"
                  : "#D97706",
              "&:hover": {
                bgcolor:
                  itemType === "shift"
                    ? "#1D4ED8"
                    : itemType === "department"
                    ? "#15803D"
                    : "#B45309",
              },
            }}
          >
            {submitting ? "Saving…" : dialogMode === "create" ? "Create" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !submitting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box
          sx={{
            bgcolor: "#FEF2F2",
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{
              bgcolor: "#FEE2E2",
              color: "#DC2626",
              width: 64,
              height: 64,
              mb: 2,
            }}
          >
            <DeleteIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#991B1B", mb: 1 }}>
            Confirm Delete
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: "#DC2626" }}>{itemToDelete?.label}</strong>?
            This action cannot be undone.
          </Typography>
        </Box>
        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: "#FFFFFF", gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={submitting}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#64748B",
              flex: 1,
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <DeleteIcon />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#DC2626",
              "&:hover": { bgcolor: "#B91C1C" },
              flex: 1,
              borderRadius: 2,
            }}
          >
            {submitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;