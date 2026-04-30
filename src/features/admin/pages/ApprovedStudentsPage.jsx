import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Avatar,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  Skeleton,
  TextField,
  Grid,
} from "@mui/material";
import {
  PrintOutlined,
  DownloadOutlined,
  FilterListOutlined,
  PeopleAltOutlined,
  RestartAltOutlined,
  EditOutlined,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { fetchApprovedStudents, fetchReceiptForReprint } from "../../../api/admin/api";
import { useAuth } from "../context/AuthContext";
import ReceiptDialog from "../components/ReceiptDialog";
import EditApprovedStudentModal from "../components/EditApprovedStudentModal";

// ── Helpers ──────────────────────────────────────────────────────
const YEAR_LABEL = { "1": "1st Year", "2": "2nd Year", "3": "3rd Year", "4": "4th Year" };
const PAGE_LIMIT = 50;

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
};

const fmtCurrency = (n) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—");

// ── Filter Select Styling ─────────────────────────────────────────
const selectSx = {
  minWidth: 160,
  "& .MuiOutlinedInput-root": {
    height: 40,
    borderRadius: "10px",
    fontSize: "0.83rem",
    bgcolor: "#fff",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" },
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#94A3B8",
  },
};

// ── Column header text ────────────────────────────────────────────
const colHdr = (label) => (
  <p
    style={{
      margin: 0,
      fontSize: "0.68rem",
      fontWeight: 700,
      color: "#94A3B8",
      textTransform: "uppercase",
      letterSpacing: "0.09em",
    }}
  >
    {label}
  </p>
);

// ── Shift chip colours ────────────────────────────────────────────
const shiftChipSx = (shift) => {
  const map = {
    "7:30":  { bgcolor: "#EFF6FF", color: "#2563EB" },
    "9:30":  { bgcolor: "#F0FDF4", color: "#15803D" },
    "10:30": { bgcolor: "#FFF7ED", color: "#C2410C" },
  };
  const style = map[shift] || { bgcolor: "#F1F5F9", color: "#475569" };
  return {
    ...style,
    fontSize: "0.7rem",
    fontWeight: 700,
    height: 22,
    borderRadius: "6px",
    border: "none",
  };
};

// ═══════════════════════════════════════════════════════════════
export default function ApprovedStudentsPage() {
  const { token } = useAuth();

  // ── Filter state ──────────────────────────────────────────────
  const [year, setYear]         = useState("");
  const [shift, setShift]       = useState("");
  const [department, setDept]   = useState("");
  const [route, setRoute]       = useState("");
  const [validityDateFrom, setValidityDateFrom] = useState("");
  const [validityDateTo, setValidityDateTo]     = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  // ── Data state ────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]       = useState("");

  // ── Dynamic filter options ────────────────────────────────────
  const allDepts  = [...new Set(students.map((s) => s.department?.label).filter(Boolean))].sort();
  const allRoutes = [...new Set(students.map((s) => s.pickupPoint?.label).filter(Boolean))].sort();

  // ── Modals ────────────────────────────────────────────────────
  const [receiptOpen, setReceiptOpen]   = useState(false);
  const [receiptData, setReceiptData]   = useState(null);
  const [reprintLoading, setReprintLoading] = useState(null);
  const [editOpen, setEditOpen]     = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  const loadStudents = useCallback(
    async (pg = 1, append = false) => {
      if (!token) return;
      append ? setLoadingMore(true) : setLoading(true);
      try {
        const res = await fetchApprovedStudents(token, { ...appliedFilters, page: pg, limit: PAGE_LIMIT });
        if (res.success) {
          setStudents((prev) => (append ? [...prev, ...res.data] : res.data));
          setTotalCount(res.totalCount);
          setHasMore(pg * PAGE_LIMIT < res.totalCount);
          setPage(pg);
        }
      } catch (err) { setError(err.message || "Failed to load students"); }
      finally { append ? setLoadingMore(false) : setLoading(false); }
    },
    [token, appliedFilters]
  );

  useEffect(() => { loadStudents(1); }, [loadStudents]);

  const handleApply = () => setAppliedFilters({ year, shift, department, route, validityDateFrom, validityDateTo });
  const handleReset = () => { setYear(""); setShift(""); setDept(""); setRoute(""); setValidityDateFrom(""); setValidityDateTo(""); setAppliedFilters({}); };
  const handleLoadMore = () => loadStudents(page + 1, true);

  const handleReprint = async (student) => {
    setReprintLoading(student.receiptNumber);
    try {
      const res = await fetchReceiptForReprint(token, student.receiptNumber);
      if (res.success && res.receiptData) { setReceiptData(res.receiptData); setReceiptOpen(true); }
    } catch (err) { alert("Could not load receipt: " + err.message); }
    finally { setReprintLoading(null); }
  };

  const handleEdit = (student) => { setEditStudent(student); setEditOpen(true); };
  const handleEditSaved = (updated) => {
    setEditOpen(false); setEditStudent(null);
    setStudents((prev) => prev.map((s) => s._id === updated._id ? { ...s, ...updated, payment: s.payment } : s));
  };

  const handleExport = () => {
    if (!students.length) return;
    const sorted = [...students].sort((a, b) => (a.receiptNumber || "").localeCompare(b.receiptNumber || "", undefined, { numeric: true }));
    const rows = sorted.map((s) => ({
      "Receipt No": s.receiptNumber, "Full Name": s.fullName, "Mobile": s.mobile, "Year": YEAR_LABEL[s.year] || s.year,
      "Department": s.department?.label, "Shift": s.shift, "Pickup Point": s.pickupPoint?.label, "Enrollment No": s.enrollmentNumber,
      "Payment Mode": s.payment?.paymentMethod, "Total Fee (₹)": s.payment?.amount, "Approved On": fmtDate(s.approvedAt)
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Approved Students");
    XLSX.writeFile(wb, `approved_students_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Desktop Grid Shared Logic ─────────────────────────────────
  const desktopGridSx = {
    display: { xs: "none", md: "grid" },
    // We use px for columns that shouldn't grow, and fr for those that should.
    // minmax(0, Xfr) is CRITICAL to prevent content from expanding the column.
    gridTemplateColumns: "minmax(0, 2.5fr) minmax(0, 1.4fr) minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1.3fr) 100px",
    gap: 2,
    alignItems: "center",
    px: 3,
  };

  return (
    <Box sx={{ maxWidth: 1250 }}>
      {/* Header Section */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box>
          <h1 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 800, color: "#0F172A" }}>Approved Students</h1>
          <Chip
            label={`${totalCount} STUDENTS APPROVED`}
            size="small"
            icon={<PeopleAltOutlined style={{ fontSize: 13 }} />}
            sx={{ mt: 0.8, height: 22, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#EFF6FF", color: "#2563EB" }}
          />
        </Box>
        <Box onClick={handleExport} sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderRadius: "10px", border: "1.5px solid #E2E8F0", bgcolor: "#fff", cursor: "pointer", transition: "all 0.15s ease", "&:hover": { bgcolor: "#F8FAFC" } }}>
          <DownloadOutlined sx={{ fontSize: 18, color: "#334155" }} />
          <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 600, color: "#334155" }}>Export</p>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E2E8F0", p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={{ xs: 12, sm: 6, md: 3}}>
            <FormControl size="small" fullWidth sx={selectSx}><InputLabel>Department</InputLabel><Select value={department} label="Department" onChange={(e) => setDept(e.target.value)}><MenuItem value="">All</MenuItem>{allDepts.map((d) => (<MenuItem key={d} value={d}>{d}</MenuItem>))}</Select></FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 3}}>
            <FormControl size="small" fullWidth sx={selectSx}><InputLabel>Year</InputLabel><Select value={year} label="Year" onChange={(e) => setYear(e.target.value)}><MenuItem value="">All</MenuItem>{["1", "2", "3", "4"].map((y) => (<MenuItem key={y} value={y}>{YEAR_LABEL[y]}</MenuItem>))}</Select></FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 3}}>
            <FormControl size="small" fullWidth sx={selectSx}><InputLabel>Route</InputLabel><Select value={route} label="Route" onChange={(e) => setRoute(e.target.value)}><MenuItem value="">All</MenuItem>{allRoutes.map((r) => (<MenuItem key={r} value={r}>{r}</MenuItem>))}</Select></FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 3}}>
            <FormControl size="small" fullWidth sx={selectSx}><InputLabel>Shift</InputLabel><Select value={shift} label="Shift" onChange={(e) => setShift(e.target.value)}><MenuItem value="">All</MenuItem>{["7:30", "9:30", "10:30"].map((s) => (<MenuItem key={s} value={s}>{s}</MenuItem>))}</Select></FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 3}}>
            <FormControl size="small" fullWidth sx={selectSx}>
              <InputLabel shrink>Validity From</InputLabel>
              <TextField
                size="small"
                type="date"
                value={validityDateFrom}
                onChange={(e) => setValidityDateFrom(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", mt: 1 } }}
                InputLabelProps={{ shrink: true }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 2.5, lg: 2 }}>
            <FormControl size="small" fullWidth sx={selectSx}>
              <InputLabel shrink>Validity To</InputLabel>
              <TextField
                size="small"
                type="date"
                value={validityDateTo}
                onChange={(e) => setValidityDateTo(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", mt: 1 } }}
                InputLabelProps={{ shrink: true }}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 2,  }}>
            <Box onClick={handleApply} sx={{ height: 40, px: 3, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", bgcolor: "#2563EB", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.83rem", "&:hover": { bgcolor: "#1D4ED8" } }}>Apply</Box>
          </Grid>
          {Object.keys(appliedFilters).length > 0 && (
            <Grid size={{ xs: 12, sm: 3, md: 2,  }}>
              <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                <IconButton onClick={handleReset} sx={{ height: 40, width: 40, bgcolor: "#F1F5F9" }}><RestartAltOutlined /></IconButton>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Main List Container */}
      <Box sx={{ bgcolor: { xs: "transparent", md: "#fff" }, borderRadius: "14px", border: { xs: "none", md: "1px solid #E2E8F0" }, overflow: "hidden" }}>
        
        {/* Table Header (Desktop) */}
        <Box sx={{ ...desktopGridSx, py: 1.5, borderBottom: "1px solid #F1F5F9", bgcolor: "#FAFAFA" }}>
          {colHdr("Student Name")}
          {colHdr("Pickup Point")}
          {colHdr("Shift")}
          {colHdr("Year")}
          {colHdr("Department")}
          <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "#94A3B8", textAlign: "right", letterSpacing: "0.09em" }}>ACTIONS</p>
        </Box>

        {/* Content Area */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 0 } }}>
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ ...desktopGridSx, display: { xs: "flex", md: "grid" }, flexDirection: "column", py: 2, borderBottom: "1px solid #F8FAFC" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  <Skeleton variant="rounded" width={38} height={38} />
                  <Box sx={{ minWidth: 0 }}><Skeleton width={120} height={16} /><Skeleton width={80} height={12} sx={{ mt: 0.5 }} /></Box>
                </Box>
                <Box sx={{ display: { xs: "none", md: "block" } }}><Skeleton width="80%" height={16} /></Box>
                <Box sx={{ display: { xs: "none", md: "block" } }}><Skeleton width="40px" height={22} /></Box>
                <Box sx={{ display: { xs: "none", md: "block" } }}><Skeleton width="50px" height={16} /></Box>
                <Box sx={{ display: { xs: "none", md: "block" } }}><Skeleton width="70%" height={16} /></Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}><Skeleton width={32} height={32} /></Box>
              </Box>
            ))
          ) : students.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center", color: "#94A3B8" }}><PeopleAltOutlined sx={{ fontSize: 40, opacity: 0.3 }} /><p>No students found</p></Box>
          ) : (
            students.map((s, idx) => (
              <Box
                key={s._id || s.receiptNumber}
                sx={{
                  // DESKTOP: Proper grid with absolute alignment to header
                  // MOBILE: Flex card
                  display: { xs: "flex", md: "grid" },
                  flexDirection: { xs: "column", md: "unset" },
                  gridTemplateColumns: desktopGridSx.gridTemplateColumns,
                  gap: { xs: 1.5, md: desktopGridSx.gap },
                  alignItems: { xs: "flex-start", md: "center" },
                  px: desktopGridSx.px,
                  py: { xs: 2, md: 1.5 },
                  bgcolor: { xs: "#fff", md: "transparent" },
                  borderRadius: { xs: "14px", md: 0 },
                  border: { xs: "1px solid #E2E8F0", md: "none" },
                  borderBottom: { xs: "none", md: idx === students.length - 1 ? "none" : "1px solid #F8FAFC" },
                  transition: "background 0.1s ease",
                  "&:hover": { bgcolor: "#FAFAFA" }
                }}
              >
                {/* 1. Student Info (Matches "Student Name" header) */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, width: "100%" }}>
                  <Avatar
                    src={s.photoUrl}
                    variant="rounded"
                    sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#EFF6FF", color: "#2563EB", border: "1.5px solid #E2E8F0", flexShrink: 0 }}
                  >
                    {s.fullName?.[0]}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.fullName}
                      </p>
                      <Box sx={{ display: { xs: "flex", md: "none" } }}>
                        <ActionButtons student={s} loading={reprintLoading === s.receiptNumber} onEdit={handleEdit} onPrint={handleReprint} />
                      </Box>
                    </Box>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748B" }}>
                      {s.mobile} • <span style={{ fontWeight: 700, color: "#475569" }}>{s.receiptNumber}</span>
                    </p>
                  </Box>
                </Box>

                {/* 2. Pickup (Desktop Only) */}
                <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.pickupPoint?.label || "—"}
                  </p>
                </Box>

                {/* 3. Shift (Desktop Only) */}
                <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0 }}>
                  {s.shift ? <Chip label={s.shift} size="small" sx={{ ...shiftChipSx(s.shift) }} /> : "—"}
                </Box>

                {/* 4. Year (Desktop Only) */}
                <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#334155", fontWeight: 600 }}>{YEAR_LABEL[s.year] || s.year}</p>
                </Box>

                {/* 5. Dept (Desktop Only) */}
                <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.department?.label || "—"}
                  </p>
                </Box>

                {/* Mobile View: Details Grid */}
                <Box sx={{ display: { xs: "grid", md: "none" }, gridTemplateColumns: "1fr 1fr", width: "100%", gap: 1.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
                  <Box><p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>PICKUP</p><p style={{ margin: 0, fontSize: "0.82rem" }}>{s.pickupPoint?.label || "—"}</p></Box>
                  <Box><p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>SHIFT</p><p style={{ margin: 0, fontSize: "0.82rem" }}>{s.shift || "—"}</p></Box>
                  <Box><p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>YEAR</p><p style={{ margin: 0, fontSize: "0.82rem" }}>{YEAR_LABEL[s.year] || s.year}</p></Box>
                  <Box><p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}>DEPT</p><p style={{ margin: 0, fontSize: "0.82rem", color: "#64748B" }}>{s.department?.label || "—"}</p></Box>
                </Box>

                {/* 6. Actions (Desktop Only) */}
                <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "flex-end" }}>
                  <ActionButtons student={s} loading={reprintLoading === s.receiptNumber} onEdit={handleEdit} onPrint={handleReprint} />
                </Box>
              </Box>
            ))
          )}
        </Box>

        {/* Footer: Load More */}
        {!loading && hasMore && (
          <Box sx={{ p: 3, textAlign: "center", borderTop: "1px solid #F1F5F9" }}>
            <Box onClick={handleLoadMore} sx={{ color: "#2563EB", fontWeight: 700, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
              {loadingMore ? "Loading..." : `Load More Students (${totalCount - students.length} remaining)`}
            </Box>
          </Box>
        )}
      </Box>

      {/* Modals */}
      <ReceiptDialog open={receiptOpen} receiptData={receiptData} onClose={() => { setReceiptOpen(false); setReceiptData(null); }} />
      <EditApprovedStudentModal open={editOpen} student={editStudent} onClose={() => { setEditOpen(false); setEditStudent(null); }} onSaved={handleEditSaved} />
    </Box>
  );
}

function ActionButtons({ student, loading, onEdit, onPrint }) {
  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(student); }} sx={{ bgcolor: "#FFF7ED", color: "#EA580C" }}><EditOutlined sx={{ fontSize: 16 }} /></IconButton></Tooltip>
      <Tooltip title="Print"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onPrint(student); }} disabled={loading} sx={{ bgcolor: "#EFF6FF", color: "#2563EB" }}>{loading ? <CircularProgress size={14} /> : <PrintOutlined sx={{ fontSize: 16 }} />}</IconButton></Tooltip>
    </Box>
  );
}