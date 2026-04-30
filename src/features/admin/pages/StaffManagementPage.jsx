import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { fetchAllStaff, createStaff, deleteStaff } from "../../../api/admin/api";

const StaffManagementPage = () => {
  const { token, user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    role: "manager",
  });
  const [formErrors, setFormErrors] = useState({});
  const [createdUser, setCreatedUser] = useState(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetchAllStaff(token);
      if (response.success) {
        setStaffList(response.users);
      }
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = () => {
    setFormData({ name: "", password: "", role: "manager" });
    setFormErrors({});
    setCreatedUser(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCreatedUser(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStaff = async () => {
    if (!validateForm()) return;

    try {
      const response = await createStaff(token, formData);
      if (response.success) {
        setCreatedUser(response.user);
        showSnackbar("Staff user created successfully!", "success");
        fetchStaff(); // Refresh the list
      }
    } catch (error) {
      showSnackbar(error.message, "error");
    }
  };

  const handleDeleteClick = (staff) => {
    setSelectedStaff(staff);
    setConfirmDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStaff) return;

    try {
      const response = await deleteStaff(token, selectedStaff.id);
      if (response.success) {
        showSnackbar("Staff user deleted successfully!", "success");
        fetchStaff(); // Refresh the list
      }
    } catch (error) {
      showSnackbar(error.message, "error");
    } finally {
      setConfirmDeleteDialog(false);
      setSelectedStaff(null);
    }
  };

  const handleCopyUsername = (username) => {
    navigator.clipboard.writeText(username);
    showSnackbar("Username copied to clipboard!", "success");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRoleChipColor = (role) => {
    return role === "admin" ? "primary" : "default";
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
            Staff Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage admin and manager accounts
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchStaff}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Staff
          </Button>
        </Box>
      </Box>

      {/* Staff Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staffList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No staff users found. Create one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              staffList.map((staff) => (
                <TableRow key={staff._id || staff.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography fontWeight={500}>{staff.username}</Typography>
                      <Tooltip title="Copy username">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyUsername(staff.username)}
                        >
                          <ContentCopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={staff.role.toUpperCase()}
                      color={getRoleChipColor(staff.role)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{formatDate(staff.createdAt)}</TableCell>
                  <TableCell align="center">
                    {(staff._id || staff.id) !== currentUser?.id && (
                      <Tooltip title="Delete user">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(staff)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Staff Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {createdUser ? "Staff User Created!" : "Create New Staff User"}
        </DialogTitle>
        <DialogContent>
          {createdUser ? (
            <Box sx={{ py: 2 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Staff user has been created successfully. Please save the credentials!
              </Alert>
              <Paper sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Generated Username
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "monospace",
                      bgcolor: "#fff",
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      border: "1px solid #e2e8f0",
                      flex: 1,
                    }}
                  >
                    {createdUser.username}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleCopyUsername(createdUser.username)}
                    startIcon={<ContentCopyIcon />}
                  >
                    Copy
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Role: {createdUser.role.toUpperCase()}
                </Typography>
              </Paper>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Make sure to share these credentials with the user. The username cannot be changed.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Full Name"
                placeholder="Enter staff member's full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={!!formErrors.name}
                helperText={formErrors.name || "Username will be auto-generated from name"}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                placeholder="Set a secure password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                error={!!formErrors.password}
                helperText={formErrors.password}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Managers can approve/reject students and manage passes. Admins have full access including user management.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {createdUser ? "Close" : "Cancel"}
          </Button>
          {!createdUser && (
            <Button
              variant="contained"
              onClick={handleCreateStaff}
              disabled={loading}
            >
              Create Staff
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteDialog}
        onClose={() => setConfirmDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: "error.main" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the user{" "}
            <strong>{selectedStaff?.username}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete
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
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StaffManagementPage;