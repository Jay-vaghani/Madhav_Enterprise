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
  LinearProgress,
  Skeleton,
  InputAdornment,
  Switch,
  FormControlLabel,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  SearchOutlined,
  TuneOutlined,
  OpenInNewOutlined,
  LocationOnOutlined,
  PendingActionsOutlined,
  VerifiedOutlined,
  DoNotDisturbAltOutlined,
  PeopleOutlined,
  NotificationsActiveOutlined,
  NotificationsOffOutlined,
  SyncOutlined,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  fetchPendingStudents,
  fetchDashboardStats,
} from "../../../api/admin/api";
import VerificationModal from "../components/VerificationModal";
import ReceiptDialog from "../components/ReceiptDialog";

function playDingDong() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playTone(880, ctx.currentTime, 0.5); // A5
    playTone(659.25, ctx.currentTime + 0.3, 0.8); // E5
  } catch (e) {
    console.warn("Audio not supported or blocked");
  }
}

export default function PendingStudentsPage() {
  const { token } = useAuth();

  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync sound setting to a ref so callbacks don't recreate constantly
  const soundEnabledRef = React.useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");

  // Verification modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStudents = useCallback(
    async (background = false) => {
      if (!token) return;
      if (!background) setIsLoading(true);
      setError("");
      try {
        const res = await fetchPendingStudents(token);

        setStudents((prev) => {
          if (background && soundEnabledRef.current) {
            const oldIds = new Set(prev.map((s) => s._id));
            const hasNew = res.data.some((s) => !oldIds.has(s._id));
            if (hasNew) {
              playDingDong();
            }
          }
          return res.data || [];
        });
        setTotalCount(res.totalCount || 0);
      } catch (err) {
        if (!background) setError(err.message);
      } finally {
        if (!background) setIsLoading(false);
      }
    },
    [token],
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      let matches = true;

      // Local search filtering
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

  // Dynamic filter options based on fetched students
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

  // Fetch stats
  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchDashboardStats(token);
      setStats(res.data || stats);
    } catch (err) {
      // Stats are non-critical, don't block
      console.error("Stats error:", err);
    }
  }, [token]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Interval hook for 5-second polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadStudents(true);
      loadStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadStudents, loadStats]);

  // Open verification modal for a student
  const openVerification = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  const handleActionComplete = (action) => {
    setModalOpen(false);
    setSelectedStudent(null);
    // Refresh both students and stats
    loadStudents();
    loadStats();
  };

  // Receipt dialog state — lives here so it persists after modal closes
  const [receiptData, setReceiptData] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const handleReceiptReady = (data) => {
    setReceiptData(data);
    setReceiptOpen(true);
  };

  const resolvedPercent =
    stats.total > 0
      ? Math.round(((stats.approved || 0) / stats.total) * 100)
      : 0;

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
              Pending Verifications
            </h1>
            <Chip
              label={`${filteredStudents.length} Students Matching`}
              size="small"
              sx={{
                bgcolor: "#EFF6FF",
                color: "#2563EB",
                fontWeight: 700,
                fontSize: "0.78rem",
                height: 28,
                borderRadius: "8px",
              }}
            />
          </Box>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#64748B" }}>
            Review and approve student transportation requests for the upcoming
            academic semester.
          </p>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label={
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#64748B",
                }}
              >
                Auto-Refresh (5s)
              </span>
            }
          />

          <Tooltip
            title={
              soundEnabled
                ? "Disable Notification Sound"
                : "Enable Notification Sound"
            }
          >
            <IconButton
              onClick={() => setSoundEnabled(!soundEnabled)}
              sx={{
                bgcolor: soundEnabled ? "#E0F2FE" : "#F1F5F9",
                color: soundEnabled ? "#0284C7" : "#94A3B8",
                "&:hover": { bgcolor: soundEnabled ? "#BAE6FD" : "#E2E8F0" },
              }}
            >
              {soundEnabled ? (
                <NotificationsActiveOutlined />
              ) : (
                <NotificationsOffOutlined />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh Manually">
            <IconButton
              onClick={() => {
                loadStudents();
                loadStats();
              }}
              disabled={isLoading}
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
              <style>
                {`
                  @keyframes spin {
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 3, borderRadius: "12px" }}
        >
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
        }}
      >
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              placeholder="Filter by student name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ fontSize: 18, color: "#94A3B8" }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: "#F8FAFC",
                  height: 42,
                  fontSize: "0.85rem",
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              size="small"
              fullWidth
              displayempty="true"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: "#F8FAFC",
                  height: 42,
                  fontSize: "0.85rem",
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
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              size="small"
              fullWidth
              displayempty="true"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: "#F8FAFC",
                  height: 42,
                  fontSize: "0.85rem",
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
          <Grid size={{ xs: 10, md: 3 }}>
            <TextField
              select
              value={pickupPoint}
              onChange={(e) => setPickupPoint(e.target.value)}
              size="small"
              fullWidth
              displayempty="true"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: "#F8FAFC",
                  height: 42,
                  fontSize: "0.85rem",
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
          <Grid size={{ xs: 2, md: 1 }}>
            <Tooltip title="Advanced Filters">
              <IconButton
                sx={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  width: 42,
                  height: 42,
                }}
              >
                <TuneOutlined sx={{ fontSize: 20, color: "#64748B" }} />
              </IconButton>
            </Tooltip>
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
              flex: 0.6,
              display: { xs: "none", sm: "block" },
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
              Year
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
              Pickup Point
            </p>
          </Box>
          <Box
            sx={{
              flex: 0.6,
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
              Fees
            </p>
          </Box>
          <Box sx={{ flex: 0.8, textAlign: "right" }}>
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
              Action
            </p>
          </Box>
        </Box>

        {/* Table Body */}
        {isLoading ? (
          <Box sx={{ p: 3 }}>
            {[1, 2, 3, 4].map((i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 2,
                  gap: 2,
                }}
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
          <Box
            sx={{
              py: 8,
              textAlign: "center",
            }}
          >
            <PendingActionsOutlined
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
              No pending verifications
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.85rem",
                color: "#94A3B8",
              }}
            >
              All matching student requests have been reviewed.
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
                py: 2,
                borderBottom:
                  index < filteredStudents.length - 1
                    ? "1px solid #F1F5F9"
                    : "none",
                transition: "background 0.15s ease",
                "&:hover": { bgcolor: "#FAFBFC" },
              }}
            >
              {/* Student Name + Avatar */}
              <Box
                sx={{
                  flex: 1.5,
                  minWidth: 180,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Avatar
                  src={student.photoUrl}
                  sx={{
                    width: 50,
                    height: 50,
                    bgcolor: "#2563EB",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    borderRadius: "10px",
                  }}
                >
                  {student.fullName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "#0F172A",
                    }}
                  >
                    {student.fullName}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "0.75rem",
                      color: "#94A3B8",
                      fontWeight: 500,
                    }}
                  >
                    {student.createdAt
                      ? new Date(student.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          },
                        )
                      : "—"}
                  </p>
                </Box>
              </Box>

              {/* Year */}
              <Box
                sx={{
                  flex: 0.6,
                  display: { xs: "none", sm: "block" },
                  minWidth: 0,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    color: "#334155",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {student.year ? `Year ${student.year}` : "—"}
                </p>
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
                    fontSize: "0.85rem",
                    color: "#334155",
                    fontWeight: 500,
                    textWrap: "wrap",
                  }}
                >
                  {student.department?.label || "—"}
                </p>
              </Box>

              {/* Pickup Point */}
              <Box
                sx={{
                  flex: 1.5,
                  display: { xs: "none", lg: "flex" },
                  alignItems: "flex-start",
                  gap: 0.5,
                  minWidth: 0,
                }}
              >
                <LocationOnOutlined
                  sx={{
                    fontSize: 16,
                    color: "#2563EB",
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    color: "#334155",
                    fontWeight: 500,
                    wordBreak: "break-word",
                  }}
                >
                  {student.pickupPoint?.label || "—"}
                </p>
              </Box>

              {/* Fees */}
              <Box
                sx={{
                  flex: 0.6,
                  display: { xs: "none", lg: "block" },
                  minWidth: 0,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    color: "#334155",
                    fontWeight: 600,
                  }}
                >
                  {student.pickupPoint?.fee}
                </p>
              </Box>

              {/* Actions */}
              <Box
                sx={{
                  flex: 0.8,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                <Tooltip title="Open Verification">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openVerification(student);
                    }}
                    sx={{
                      color: "#2563EB",
                      border: "1px solid #BFDBFE",
                      borderRadius: "8px",
                      "&:hover": {
                        bgcolor: "#EFF6FF",
                        borderColor: "#2563EB",
                      },
                    }}
                  >
                    <OpenInNewOutlined sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}

        {/* Pagination Controls Removed */}
      </Paper>

      {/* Queue Health Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Queue Health
        </p>
        <Grid container spacing={3} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#2563EB",
                }}
              >
                {resolvedPercent}%
              </p>
              <LinearProgress
                variant="determinate"
                value={resolvedPercent}
                sx={{
                  flex: 1,
                  height: 10,
                  borderRadius: 5,
                  bgcolor: "#E2E8F0",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "#2563EB",
                    borderRadius: 5,
                  },
                }}
              />
            </Box>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#94A3B8" }}>
              {stats.total > 0
                ? `${(stats.approved || 0) + (stats.rejected || 0)} of ${stats.total} total registrations have been processed.`
                : "No registrations yet."}
            </p>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-start", md: "flex-end" },
                gap: 4,
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Resolved
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#2563EB",
                  }}
                >
                  {stats.approved}
                </p>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Rejected
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#EF4444",
                  }}
                >
                  {stats.rejected}
                </p>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Verification Modal */}
      <VerificationModal
        open={modalOpen}
        student={selectedStudent}
        onClose={handleModalClose}
        onActionComplete={handleActionComplete}
        onReceiptReady={handleReceiptReady}
      />

      {/* Receipt Dialog — independent from verification modal */}
      <ReceiptDialog
        open={receiptOpen}
        receiptData={receiptData}
        onClose={() => {
          setReceiptOpen(false);
          setReceiptData(null);
        }}
      />
    </Box>
  );
}
