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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Avatar,
  CircularProgress,
  Tooltip,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Close,
  AssignmentReturned,
  History,
  WarningAmber,
  CheckCircle,
  Block,
  Search,
  FilterList,
  Person,
  LocationOn,
  AccessTime,
  Photo,
  Notes,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  getConfiscations,
  releaseIdCard,
  getStudentHistory,
} from "../../../api/admin/confiscationApi";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (dateVal) => {
  if (!dateVal) return "—";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "—";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(d.getDate()).padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

const fmtShort = (dateVal) => {
  if (!dateVal) return "—";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "—";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`;
};

const ordinalSuffix = (n) => {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, bg }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        gap: 2,
        flex: 1,
        minWidth: 160,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          bgcolor: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
      </Box>
      <Box>
        <Typography
          variant="h5"
          fontWeight="800"
          color="#0F172A"
          lineHeight={1.1}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="#64748B" fontWeight="600">
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ConfiscationsPage() {
  const { token } = useAuth();

  const [confiscations, setConfiscations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "confiscated" | "released" | "repeat"
  const [search, setSearch] = useState("");

  // History modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Release confirm modal
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [releasing, setReleasing] = useState(false);

  const fetchConfiscations = async () => {
    setLoading(true);
    const res = await getConfiscations(token);
    if (res?.success) setConfiscations(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchConfiscations();
  }, [token]);

  const handleRelease = async () => {
    if (!releaseTarget) return;
    setReleasing(true);
    const res = await releaseIdCard(releaseTarget._id, token);
    if (res?.success) {
      fetchConfiscations();
      setReleaseTarget(null);
    }
    setReleasing(false);
  };

  const handleViewHistory = async (row) => {
    setSelectedStudent(row);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    const res = await getStudentHistory(row.mobile, token);
    if (res?.success) setHistoryData(res.data);
    setHistoryLoading(false);
  };

  // ── Derived stats ──
  const totalIncidents = confiscations.length;
  const stillConfiscated = confiscations.filter(
    (c) => c.status !== "id_released",
  ).length;
  const released = confiscations.filter(
    (c) => c.status === "id_released",
  ).length;
  const repeatOffenders = new Set(
    confiscations.filter((c) => c.offenceCount > 1).map((c) => c.mobile),
  ).size;

  // ── Filtered rows ──
  const filtered = confiscations.filter((c) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "confiscated" && c.status !== "id_released") ||
      (filter === "released" && c.status === "id_released") ||
      (filter === "repeat" && c.offenceCount > 1);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.studentName?.toLowerCase().includes(q) ||
      c.mobile?.includes(q) ||
      c.enrollmentNumber?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // ── Filter pills config ──
  const FILTERS = [
    { key: "all", label: "All Incidents" },
    { key: "confiscated", label: "ID Confiscated" },
    { key: "released", label: "ID Released" },
    { key: "repeat", label: "Repeat Offenders" },
  ];

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* ── Header ── */}
      <Box>
        <Typography variant="h5" fontWeight="800" color="#0F172A">
          ID Confiscations
        </Typography>
        <Typography variant="body2" color="#64748B" sx={{ mt: 0.5 }}>
          Track students caught travelling without a bus pass and manage ID card
          releases.
        </Typography>
      </Box>

      {/* ── Stat Cards ── */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <StatCard
          label="Total Incidents"
          value={totalIncidents}
          icon={<Block />}
          color="#6366F1"
          bg="#EEF2FF"
        />
        <StatCard
          label="IDs Confiscated"
          value={stillConfiscated}
          icon={<WarningAmber />}
          color="#DC2626"
          bg="#FEF2F2"
        />
        <StatCard
          label="IDs Released"
          value={released}
          icon={<CheckCircle />}
          color="#059669"
          bg="#ECFDF5"
        />
        <StatCard
          label="Repeat Offenders"
          value={repeatOffenders}
          icon={<Person />}
          color="#D97706"
          bg="#FFFBEB"
        />
      </Box>

      {/* ── Table Card ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* ── Toolbar ── */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
            borderBottom: "1px solid #F1F5F9",
            bgcolor: "#FAFBFC",
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search by name, mobile, enroll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#94A3B8", fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              minWidth: 260,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#fff",
                fontSize: "0.85rem",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": { borderColor: "#6366F1" },
              },
            }}
          />

          {/* Filter pills */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <FilterList sx={{ color: "#94A3B8", fontSize: 18 }} />
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                size="small"
                onClick={() => setFilter(f.key)}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  bgcolor: filter === f.key ? "#6366F1" : "#F1F5F9",
                  color: filter === f.key ? "#fff" : "#64748B",
                  border: "none",
                  "&:hover": {
                    bgcolor: filter === f.key ? "#4F46E5" : "#E2E8F0",
                  },
                }}
              />
            ))}
          </Box>

          <Box sx={{ ml: "auto" }}>
            <Typography variant="caption" color="#94A3B8" fontWeight="600">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>

        {/* ── Table ── */}
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {[
                  "Student",
                  "Contact",
                  "Caught At",
                  "Offence",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#94A3B8",
                      bgcolor: "#F8FAFC",
                      borderBottom: "1px solid #E2E8F0",
                      py: 1.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={28} sx={{ color: "#6366F1" }} />
                    <Typography variant="body2" color="#94A3B8" sx={{ mt: 1 }}>
                      Loading records…
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "16px",
                        bgcolor: "#F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 1.5,
                      }}
                    >
                      <Block sx={{ color: "#CBD5E1", fontSize: 28 }} />
                    </Box>
                    <Typography fontWeight="700" color="#64748B">
                      No records found
                    </Typography>
                    <Typography variant="caption" color="#94A3B8">
                      Try changing the filter or search term.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const isReleased = row.status === "id_released";
                  const isRepeat = row.offenceCount > 1;
                  return (
                    <TableRow
                      key={row._id}
                      hover
                      sx={{
                        bgcolor:
                          isRepeat && !isReleased ? "#FFFBEB" : "inherit",
                        "&:last-child td": { border: 0 },
                        "& td": { borderColor: "#F1F5F9" },
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Student */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            src={row.photoUrl}
                            variant="rounded"
                            sx={{
                              width: 38,
                              height: 38,
                              border: "2px solid",
                              borderColor: isRepeat ? "#FDE68A" : "#E2E8F0",
                              borderRadius: "10px",
                              bgcolor: "#F1F5F9",
                            }}
                          >
                            <Person sx={{ fontSize: 18, color: "#CBD5E1" }} />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight="700"
                              color="#0F172A"
                            >
                              {row.studentName}
                            </Typography>
                            {isRepeat && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#D97706",
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.3,
                                }}
                              >
                                <WarningAmber sx={{ fontSize: 11 }} /> Repeat
                                offender
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Contact */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="#334155"
                        >
                          {row.mobile}
                        </Typography>
                        <Typography variant="caption" color="#94A3B8">
                          {row.enrollmentNumber || "No enroll no."}
                        </Typography>
                      </TableCell>

                      {/* Date */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <AccessTime sx={{ fontSize: 13, color: "#94A3B8" }} />
                          <Typography
                            variant="caption"
                            color="#475569"
                            fontWeight="600"
                          >
                            {fmtDate(row.caughtAt)}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Offence count */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={`${ordinalSuffix(row.offenceCount)} Offence`}
                          size="small"
                          sx={{
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            bgcolor: isRepeat ? "#FEF2F2" : "#F1F5F9",
                            color: isRepeat ? "#DC2626" : "#475569",
                            border: `1px solid ${isRepeat ? "#FECACA" : "#E2E8F0"}`,
                          }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={isReleased ? "Released" : "Confiscated"}
                          size="small"
                          icon={
                            isReleased ? (
                              <CheckCircle
                                sx={{
                                  fontSize: "13px !important",
                                  color: "#059669 !important",
                                }}
                              />
                            ) : (
                              <Block
                                sx={{
                                  fontSize: "13px !important",
                                  color: "#DC2626 !important",
                                }}
                              />
                            )
                          }
                          sx={{
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            pl: 0.5,
                            bgcolor: isReleased ? "#ECFDF5" : "#FEF2F2",
                            color: isReleased ? "#059669" : "#DC2626",
                            border: `1px solid ${isReleased ? "#A7F3D0" : "#FECACA"}`,
                          }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {!isReleased && (
                            <Tooltip title="Mark ID as released">
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={
                                  <AssignmentReturned
                                    sx={{ fontSize: "15px !important" }}
                                  />
                                }
                                onClick={() => setReleaseTarget(row)}
                                sx={{
                                  textTransform: "none",
                                  borderRadius: "8px",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  bgcolor: "#059669",
                                  "&:hover": { bgcolor: "#047857" },
                                  boxShadow: "none",
                                  px: 1.5,
                                  py: 0.5,
                                }}
                              >
                                Release
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip title="View full offence history">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                <History sx={{ fontSize: "15px !important" }} />
                              }
                              onClick={() => handleViewHistory(row)}
                              sx={{
                                textTransform: "none",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                borderColor: "#E2E8F0",
                                color: "#475569",
                                "&:hover": {
                                  borderColor: "#6366F1",
                                  color: "#6366F1",
                                  bgcolor: "#EEF2FF",
                                },
                                px: 1.5,
                                py: 0.5,
                              }}
                            >
                              History
                            </Button>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Release Confirm Dialog ── */}
      <Dialog
        open={!!releaseTarget}
        onClose={() => setReleaseTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="800" color="#0F172A">
                Release ID Card?
              </Typography>
              <Typography variant="caption" color="#64748B">
                This action cannot be undone.
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setReleaseTarget(null)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {releaseTarget && (
            <Box
              sx={{
                bgcolor: "#F8FAFC",
                borderRadius: "12px",
                p: 2,
                border: "1px solid #E2E8F0",
                display: "flex",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Avatar
                src={releaseTarget.photoUrl}
                variant="rounded"
                sx={{ width: 48, height: 48, borderRadius: "10px" }}
              >
                <Person />
              </Avatar>
              <Box>
                <Typography fontWeight="700" color="#0F172A">
                  {releaseTarget.studentName}
                </Typography>
                <Typography variant="caption" color="#64748B">
                  {releaseTarget.mobile} ·{" "}
                  {ordinalSuffix(releaseTarget.offenceCount)} Offence
                </Typography>
              </Box>
            </Box>
          )}
          <Typography variant="body2" color="#475569" sx={{ mt: 2 }}>
            Confirm that this student's ID card has been physically returned to
            them.
          </Typography>
        </DialogContent>
        <Box sx={{ display: "flex", gap: 1.5, p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setReleaseTarget(null)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#E2E8F0",
              color: "#64748B",
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleRelease}
            disabled={releasing}
            startIcon={
              releasing ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CheckCircle />
              )
            }
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#059669",
              "&:hover": { bgcolor: "#047857" },
              boxShadow: "none",
            }}
          >
            {releasing ? "Releasing…" : "Confirm Release"}
          </Button>
        </Box>
      </Dialog>

      {/* ── History Timeline Modal ── */}
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            p: 3,
            pb: 2,
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Avatar
              src={selectedStudent?.photoUrl}
              variant="rounded"
              sx={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="800" color="#fff">
                {selectedStudent?.studentName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.75)",
                  display: "flex",
                  gap: 1,
                }}
              >
                {selectedStudent?.mobile} · Offence history
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setHistoryModalOpen(false)}
            sx={{ color: "#fff" }}
          >
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
          {historyLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress sx={{ color: "#6366F1" }} />
            </Box>
          ) : historyData.length === 0 ? (
            <Typography color="textSecondary" textAlign="center" sx={{ py: 4 }}>
              No history found.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Summary badge */}
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <Chip
                  icon={<WarningAmber sx={{ fontSize: "14px !important" }} />}
                  label={`${historyData.length} total offence${historyData.length !== 1 ? "s" : ""}`}
                  size="small"
                  sx={{
                    bgcolor: "#FEF2F2",
                    color: "#DC2626",
                    fontWeight: 700,
                    border: "1px solid #FECACA",
                  }}
                />
                <Chip
                  icon={<CheckCircle sx={{ fontSize: "14px !important" }} />}
                  label={`${historyData.filter((h) => h.status === "id_released").length} released`}
                  size="small"
                  sx={{
                    bgcolor: "#ECFDF5",
                    color: "#059669",
                    fontWeight: 700,
                    border: "1px solid #A7F3D0",
                  }}
                />
              </Box>

              {historyData.map((item, index) => {
                const isReleased = item.status === "id_released";
                return (
                  <Box
                    key={item._id}
                    sx={{ display: "flex", gap: 2, position: "relative" }}
                  >
                    {/* Timeline line */}
                    {index !== historyData.length - 1 && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: 19,
                          top: 40,
                          bottom: -16,
                          width: 2,
                          background:
                            "linear-gradient(to bottom, #E2E8F0 0%, transparent 100%)",
                          zIndex: 0,
                        }}
                      />
                    )}

                    {/* Node */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: isReleased ? "#ECFDF5" : "#FEF2F2",
                        border: `2px solid ${isReleased ? "#A7F3D0" : "#FECACA"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight="800"
                        color={isReleased ? "#059669" : "#DC2626"}
                      >
                        {historyData.length - index}
                      </Typography>
                    </Box>

                    {/* Card */}
                    <Paper
                      elevation={0}
                      sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: "14px",
                        border: "1px solid",
                        borderColor: isReleased ? "#D1FAE5" : "#FECACA",
                        bgcolor: "#fff",
                      }}
                    >
                      {/* Row 1: location + date */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <AccessTime sx={{ fontSize: 12, color: "#94A3B8" }} />
                        <Typography
                          variant="caption"
                          color="#64748B"
                          fontWeight="600"
                        >
                          {fmtDate(item.caughtAt)}
                        </Typography>
                      </Box>

                      {/* Note */}
                      {item.checkerNote && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.75,
                            alignItems: "flex-start",
                            bgcolor: "#F8FAFC",
                            borderRadius: "8px",
                            p: 1,
                            mb: 1.5,
                          }}
                        >
                          <Notes
                            sx={{ fontSize: 14, color: "#94A3B8", mt: 0.1 }}
                          />
                          <Typography
                            variant="caption"
                            color="#475569"
                            fontStyle="italic"
                          >
                            "{item.checkerNote}"
                          </Typography>
                        </Box>
                      )}

                      {/* Row 2: status + photo */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Chip
                          size="small"
                          icon={
                            isReleased ? (
                              <CheckCircle
                                sx={{
                                  fontSize: "12px !important",
                                  color: "#059669 !important",
                                }}
                              />
                            ) : (
                              <Block
                                sx={{
                                  fontSize: "12px !important",
                                  color: "#DC2626 !important",
                                }}
                              />
                            )
                          }
                          label={
                            isReleased
                              ? `Released on ${fmtShort(item.releasedAt)}`
                              : "ID Still Confiscated"
                          }
                          sx={{
                            pl: 0.5,
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "0.68rem",
                            bgcolor: isReleased ? "#ECFDF5" : "#FEF2F2",
                            color: isReleased ? "#059669" : "#DC2626",
                          }}
                        />
                        {item.photoUrl && (
                          <Tooltip title="Photo evidence">
                            <Avatar
                              src={item.photoUrl}
                              variant="rounded"
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "10px",
                                border: "2px solid #E2E8F0",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                window.open(item.photoUrl, "_blank")
                              }
                            />
                          </Tooltip>
                        )}
                        {!item.photoUrl && (
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: "10px",
                              bgcolor: "#F1F5F9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <Photo sx={{ fontSize: 16, color: "#CBD5E1" }} />
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
