import React, { useState, useEffect } from "react";
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
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  fetchAllStaffPickupPoints,
  createStaffPickupPoint,
  updateStaffPickupPoint,
  deleteStaffPickupPoint,
} from "../../../api/admin/api";

const StaffSettingsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  // Data state
  const [pickupPoints, setPickupPoints] = useState([]);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetchAllStaffPickupPoints(token);
      if (res.success) setPickupPoints(res.pickupPoints);
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

  const handleOpenCreateDialog = () => {
    setDialogMode("create");
    setFormErrors({});
    setFormData({ label: "", fee: "", isActive: true });
    setSelectedItem(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (item) => {
    setDialogMode("edit");
    setFormErrors({});
    setSelectedItem(item);
    setFormData({ ...item });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.label?.trim()) {
      errors.label = "Label is required";
    }
    if (!formData.fee || formData.fee < 0) {
      errors.fee = "Valid fee is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = { ...formData };

      if (dialogMode === "create") {
        const res = await createStaffPickupPoint(token, payload);
        if (res.success) {
          showSnackbar("Staff pickup point created successfully!");
          setPickupPoints([...pickupPoints, res.pickupPoint]);
        }
      } else {
        const res = await updateStaffPickupPoint(token, selectedItem._id, payload);
        if (res.success) {
          showSnackbar("Staff pickup point updated successfully!");
          setPickupPoints(pickupPoints.map((p) => (p._id === res.pickupPoint._id ? res.pickupPoint : p)));
        }
      }

      handleCloseDialog();
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setSubmitting(true);
    try {
      const res = await deleteStaffPickupPoint(token, itemToDelete._id);
      if (res.success) {
        showSnackbar("Staff pickup point deleted successfully!");
        setPickupPoints(pickupPoints.filter((p) => p._id !== itemToDelete._id));
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderDialogContent = () => (
    <Box sx={{ pt: 1 }}>
      <TextField
        fullWidth
        label="Pickup Point Name"
        placeholder="e.g., Central Station"
        value={formData.label || ""}
        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
        error={!!formErrors.label}
        helperText={formErrors.label || "Display name"}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        label="Monthly Fee (₹)"
        type="tel"
        inputMode="numeric"
        placeholder="e.g., 8800"
        value={formData.fee || ""}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9]/g, "");
          setFormData({ ...formData, fee: value });
        }}
        error={!!formErrors.fee}
        helperText={formErrors.fee || "Transport fee for this pickup point"}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography sx={{ fontWeight: 700, color: "#64748B" }}>₹</Typography>
            </InputAdornment>
          ),
        }}
      />
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

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: "auto" }}>
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
            sx={{ fontWeight: 800, color: "#1E293B", mb: 0.5 }}
          >
            Staff Settings
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748B" }}>
            Manage pickup points and fees for staff members.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          sx={{
            bgcolor: "#2563EB",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1,
            borderRadius: 2,
            boxShadow: "0 4px 14px 0 rgba(37,99,235,0.39)",
            "&:hover": { bgcolor: "#1D4ED8" },
          }}
        >
          Add Pickup Point
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {pickupPoints.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ textAlign: "center", py: 6, color: "#64748B" }}>
                <LocationIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
                <Typography>No staff pickup points found. Create one to get started.</Typography>
              </Box>
            </Grid>
          ) : (
            pickupPoints.map((point) => (
              <Grid key={point._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
                            onClick={() => handleOpenEditDialog(point)}
                            sx={{ color: "#2563EB" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(point)}
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <LocationIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {dialogMode === "create" ? "Add Staff Pickup Point" : "Edit Staff Pickup Point"}
          </Typography>
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: "absolute", right: 16, top: 16 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>{renderDialogContent()}</DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              boxShadow: "none",
            }}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Alert severity="warning" icon={<DeleteIcon />} sx={{ width: "100%", ".MuiAlert-message": { pt: 0.5, fontWeight: 700, fontSize: "1.1rem" } }}>
            Delete Pickup Point?
          </Alert>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <b>{itemToDelete?.label}</b>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={submitting}
            sx={{ fontWeight: 600, boxShadow: "none" }}
          >
            {submitting ? "Deleting..." : "Yes, Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StaffSettingsPage;
