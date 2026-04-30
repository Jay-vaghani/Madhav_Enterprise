import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  TextField,
  MenuItem,
  IconButton,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Skeleton,
  InputAdornment,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  SearchOutlined,
  DoNotDisturbAltOutlined,
  RestoreOutlined,
  DeleteForeverOutlined,
  SyncOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  fetchRejectedStudents,
  restoreRejectedStudent,
  permanentDeleteRejected,
} from "../../../api/admin/api";

export default function RejectedStudentsPage() {
  const { token } = useAuth();

  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStudents = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetchRejectedStudents(token, 1, 100); // Fetching top 100
      setStudents(res.data || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      let matches = true;
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const nameMatch = student.fullName?.toLowerCase().includes(query);
        const enrolmentMatch = student.enrollmentNumber
          ?.toLowerCase()
          .includes(query);
        if (!nameMatch && !enrolmentMatch) matches = false;
      }
      if (department && student.department?.label !== department)
        matches = false;
      if (year && student.year !== String(year)) matches = false;
      if (pickupPoint && student.pickupPoint?.label !== pickupPoint)
        matches = false;
      return matches;
    });
  }, [students, debouncedSearch, department, year, pickupPoint]);

  const uniqueDepartments = useMemo(() => {
    const deps = students.map((s) => s.department?.label).filter(Boolean);
    return [...new Set(deps)].sort();
  }, [students]);

  const uniqueYears = useMemo(() => {
    const yrs = students.map((s) => String(s.year)).filter(Boolean);
    return [...new Set(yrs)].sort((a, b) => a.localeCompare(b));
  }, [students]);

  const uniquePickupPoints = useMemo(() => {
    const pts = students.map((s) => s.pickupPoint?.label).filter(Boolean);
    return [...new Set(pts)].sort();
  }, [students]);

  const handleRestore = async (id, fullName) => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await restoreRejectedStudent(token, id);
      setSuccess(`${fullName} has been restored to the pending queue.`);
      loadStudents();
    } catch (err) {
      setError(err.message || "Failed to restore student");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await permanentDeleteRejected(token, studentToDelete._id);
      setSuccess(
        `${studentToDelete.fullName}'s record has been permanently deleted.`,
      );
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      loadStudents();
    } catch (err) {
      setError(err.message || "Failed to delete student");
      setDeleteDialogOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "1.85rem",
                fontWeight: 800,
                color: "#0F172A",
              }}
            >
              Rejected Verifications
            </h1>
            <Chip
              label={`${filteredStudents.length} Students`}
              size="small"
              sx={{
                bgcolor: "#FEF2F2",
                color: "#EF4444",
                fontWeight: 700,
                fontSize: "0.78rem",
                height: 28,
                borderRadius: "8px",
              }}
            />
          </Box>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#64748B" }}>
            Review, restore, or permanently delete rejected student
            registrations.
          </p>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Tooltip title="Refresh List">
            <IconButton
              onClick={loadStudents}
              disabled={isLoading || actionLoading}
              sx={{
                bgcolor: "#EFF6FF",
                color: "#2563EB",
                "&:hover": { bgcolor: "#DBEAFE" },
              }}
            >
              <SyncOutlined
                sx={{
                  animation: isLoading ? "spin 1s linear infinite" : "none",
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 3, borderRadius: "12px" }}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ mb: 3, borderRadius: "12px" }}
        >
          {success}
        </Alert>
      )}

      {/* Filters */}
      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: "20px",
          border: "1px solid #E2E8F0",
          bgcolor: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
        }}
      >
        <Grid container spacing={3} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              placeholder="Search by name or enrollment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ fontSize: 20, color: "#94A3B8" }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "#F8FAFC",
                  "& fieldset": { border: "1px solid #E2E8F0" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused fieldset": { borderColor: "#2563EB" },
                  height: 44,
                  fontSize: "0.88rem",
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <TextField
              label="Department"
              select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "#F8FAFC",
                  height: 44,
                  fontSize: "0.88rem",
                },
              }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {uniqueDepartments.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <TextField
              label="Year"
              select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "#F8FAFC",
                  height: 44,
                  fontSize: "0.88rem",
                },
              }}
            >
              <MenuItem value="">All Years</MenuItem>
              {uniqueYears.map((y) => (
                <MenuItem key={y} value={y}>
                  Year {y}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Pickup Point"
              select
              value={pickupPoint}
              onChange={(e) => setPickupPoint(e.target.value)}
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "#F8FAFC",
                  height: 44,
                  fontSize: "0.88rem",
                },
              }}
            >
              <MenuItem value="">All Pickup Points</MenuItem>
              {uniquePickupPoints.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Student Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          mb: 3,
        }}
      >
        {/* Table Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 3,
            py: 1.5,
            bgcolor: "#FAFBFC",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <Box sx={{ flex: 1.5, minWidth: 180 }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Student Name
            </p>
          </Box>
          <Box
            sx={{
              flex: 1.5,
              display: { xs: "none", md: "block" },
              minWidth: 0,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Department
            </p>
          </Box>
          <Box
            sx={{
              flex: 1.5,
              display: { xs: "none", lg: "block" },
              minWidth: 0,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Rejection Reason
            </p>
          </Box>
          <Box sx={{ flex: 1, textAlign: "right" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Actions
            </p>
          </Box>
        </Box>

        {/* Table Body */}
        {isLoading ? (
          <Box sx={{ p: 3 }}>
            {[1, 2, 3, 4].map((i) => (
              <Box
                key={i}
                sx={{ display: "flex", alignItems: "center", py: 2, gap: 2 }}
              >
                <Skeleton variant="rectangular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="60%" height={20} />
                  <Skeleton width="30%" height={16} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : filteredStudents.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <DoNotDisturbAltOutlined
              sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              No rejected registrations
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.85rem",
                color: "#94A3B8",
              }}
            >
              There are no records in the rejected archive.
            </p>
          </Box>
        ) : (
          filteredStudents.map((student, index) => (
            <Box
              key={student._id}
              sx={{
                display: "flex",
                alignItems: "center",
                px: 3,
                py: 2.5,
                borderBottom:
                  index < filteredStudents.length - 1
                    ? "1px solid #F1F5F9"
                    : "none",
                transition: "all 0.2s ease",
                "&:hover": { bgcolor: "#F8FAFC", transform: "scale(1.002)" },
              }}
            >
              {/* Student Name + Avatar */}
              <Box
                sx={{
                  flex: 1.5,
                  minWidth: 200,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={student.photoUrl}
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: "#F1F5F9",
                      fontSize: "1rem",
                      fontWeight: 800,
                      borderRadius: "14px",
                      border: "2px solid white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      color: "#475569",
                    }}
                  >
                    {student.fullName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 14,
                      height: 14,
                      bgcolor: "#EF4444",
                      borderRadius: "50%",
                      border: "2px solid white",
                    }}
                  />
                </Box>
                <Box>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "#0F172A",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {student.fullName}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "0.72rem",
                      color: "#94A3B8",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {student.rejectedAt
                      ? new Date(student.rejectedAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "—"}
                  </p>
                </Box>
              </Box>

              {/* Department */}
              <Box
                sx={{
                  flex: 1.5,
                  display: { xs: "none", md: "block" },
                  minWidth: 0,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.88rem",
                    color: "#334155",
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  {student.department?.label || "—"}
                </p>
                <Chip
                  label={`Year ${student.year || "—"}`}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 18,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    bgcolor: "#F1F5F9",
                    color: "#64748B",
                    borderRadius: "4px",
                  }}
                />
              </Box>

              {/* Rejection Reason */}
              <Box
                sx={{
                  flex: 1.5,
                  display: { xs: "none", lg: "flex" },
                  alignItems: "flex-start",
                  gap: 1.5,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: "#FFF1F2",
                    borderRadius: "10px",
                    border: "1px solid #FFE4E6",
                    width: "100%",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.82rem",
                      color: "#E11D48",
                      fontWeight: 500,
                      fontStyle: student.rejectionReason ? "normal" : "italic",
                      lineHeight: 1.4,
                    }}
                  >
                    {student.rejectionReason || "No reason provided"}
                  </p>
                </Box>
              </Box>

              {/* Actions */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                <Tooltip title="Restore to Pending">
                  <IconButton
                    onClick={() => handleRestore(student._id, student.fullName)}
                    disabled={actionLoading}
                    sx={{
                      color: "#0EA5E9",
                      bgcolor: "#F0F9FF",
                      "&:hover": {
                        bgcolor: "#E0F2FE",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s",
                      width: 38,
                      height: 38,
                    }}
                  >
                    {actionLoading ? (
                      <CircularProgress size={18} />
                    ) : (
                      <RestoreOutlined fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Permanently">
                  <IconButton
                    onClick={() => confirmDelete(student)}
                    disabled={actionLoading}
                    sx={{
                      color: "#F43F5E",
                      bgcolor: "#FFF1F2",
                      "&:hover": {
                        bgcolor: "#FFE4E6",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s",
                      width: 38,
                      height: 38,
                    }}
                  >
                    <DeleteForeverOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogContent sx={{ textAlign: "center", pt: 4, pb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#FEF2F2",
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <WarningAmberOutlined sx={{ fontSize: 32 }} />
          </Box>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "#0F172A",
            }}
          >
            Permanently Delete Record
          </h2>
          <p
            style={{ margin: "0 0 24px", fontSize: "0.9rem", color: "#64748B" }}
          >
            Are you sure you want to completely delete{" "}
            <strong>{studentToDelete?.fullName}</strong>? This action cannot be
            undone and will delete all associated data including uploaded
            photos.
          </p>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, justifyContent: "center", gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            disabled={actionLoading}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              borderColor: "#E2E8F0",
              color: "#64748B",
              "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={actionLoading}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              minWidth: 120,
            }}
          >
            {actionLoading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Delete Forever"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
