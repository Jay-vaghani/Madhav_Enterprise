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

  // Applied filters (only sent to API when Apply Filters is clicked)
  const [appliedFilters, setAppliedFilters] = useState({});

  // ── Data state ────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]       = useState("");

  // ── Dynamic filter options (derived from loaded data) ─────────
  const allDepts  = [...new Set(students.map((s) => s.department?.label).filter(Boolean))].sort();
  const allRoutes = [...new Set(students.map((s) => s.pickupPoint?.label).filter(Boolean))].sort();

  // ── Receipt reprint state ──────────────────────────────────────
  const [receiptOpen, setReceiptOpen]   = useState(false);
  const [receiptData, setReceiptData]   = useState(null);
  const [reprintLoading, setReprintLoading] = useState(null);

  // ── Edit modal state ───────────────────────────────────────────
  const [editOpen, setEditOpen]     = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  // ── Load students ─────────────────────────────────────────────
  const loadStudents = useCallback(
    async (pg = 1, append = false) => {
      if (!token) return;
      append ? setLoadingMore(true) : setLoading(true);
      setError("");
      try {
        const res = await fetchApprovedStudents(token, {
          ...appliedFilters,
          page: pg,
          limit: PAGE_LIMIT,
        });
        if (res.success) {
          setStudents((prev) => (append ? [...prev, ...res.data] : res.data));
          setTotalCount(res.totalCount);
          setHasMore(pg * PAGE_LIMIT < res.totalCount);
          setPage(pg);
        }
      } catch (err) {
        setError(err.message || "Failed to load students");
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [token, appliedFilters]
  );

  useEffect(() => {
    loadStudents(1);
  }, [loadStudents]);

  // ── Apply / Reset filters ─────────────────────────────────────
  const handleApply = () => {
    const f = {};
    if (year)       f.year       = year;
    if (shift)      f.shift      = shift;
    if (department) f.department = department;
    if (route)      f.route      = route;
    setAppliedFilters(f);
  };

  const handleReset = () => {
    setYear(""); setShift(""); setDept(""); setRoute("");
    setAppliedFilters({});
  };

  // ── Load more ─────────────────────────────────────────────────
  const handleLoadMore = () => loadStudents(page + 1, true);

  // ── Reprint receipt ───────────────────────────────────────────
  const handleReprint = async (student) => {
    setReprintLoading(student.receiptNumber);
    try {
      const res = await fetchReceiptForReprint(token, student.receiptNumber);
      if (res.success && res.receiptData) {
        setReceiptData(res.receiptData);
        setReceiptOpen(true);
      }
    } catch (err) {
      alert("Could not load receipt: " + err.message);
    } finally {
      setReprintLoading(null);
    }
  };

  // ── Open edit modal ───────────────────────────────────────────
  const handleEdit = (student) => {
    setEditStudent(student);
    setEditOpen(true);
  };

  // ── After successful edit ─────────────────────────────────────
  const handleEditSaved = (updatedStudent) => {
    setEditOpen(false);
    setEditStudent(null);
    // Update the student in-place in the list
    setStudents((prev) =>
      prev.map((s) =>
        s._id === updatedStudent._id
          ? { ...s, ...updatedStudent, payment: s.payment }
          : s
      )
    );
  };

  // ── Export to Excel ───────────────────────────────────────────
  // Exports ONLY the currently visible (filtered) students, sorted ASCENDING
  const handleExport = () => {
    if (!students.length) return;

    // Sort ascending by receipt number before export
    const sorted = [...students].sort((a, b) =>
      (a.receiptNumber || "").localeCompare(b.receiptNumber || "", undefined, { numeric: true })
    );

    const rows = sorted.map((s) => ({
      "Receipt No":         s.receiptNumber || "",
      "Full Name":          s.fullName || "",
      "Mobile":             s.mobile || "",
      "Guardian Mobile":    s.guardianMobile || "",
      "Email":              s.email || "",
      "Permanent Address":  s.permanentAddress || "",
      "Pin Code":           s.pinCode || "",
      "Year":               YEAR_LABEL[s.year] || s.year || "",
      "Semester":           s.semester || "",
      "Department":         s.department?.label || "",
      "Shift":              s.shift || "",
      "Pickup Point":       s.pickupPoint?.label || "",
      "Enrollment No":      s.enrollmentNumber || "",
      "Payment Mode":       s.payment?.paymentMethod || "",
      "Settlement Account": s.payment?.settlementAccount || "",
      "Total Fee (₹)":      s.payment?.amount ?? "",
      "Cash Amount (₹)":    s.payment?.cashAmount ?? "",
      "Bank Amount (₹)":    s.payment?.bankAmount ?? "",
      "Transaction ID 1":   s.payment?.transaction1 || "",
      "Transaction ID 2":   s.payment?.transaction2 || "",
      "Validity Date":      fmtDate(s.validityDate),
      "Approved On":        fmtDate(s.approvedAt),
      "Remarks":            s.remarks || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length)) + 2,
    }));
    worksheet["!cols"] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Approved Students");
    const filterTag = Object.keys(appliedFilters).length
      ? `_${Object.values(appliedFilters).join("_")}`
      : "";
    const filename = `approved_students${filterTag}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 1200 }}>
      {/* ── Header ── */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <h1
            style={{
              margin: 0,
              fontSize: "1.55rem",
              fontWeight: 800,
              color: "#0F172A",
            }}
          >
            Approved Students
          </h1>
          <Chip
            label={`${totalCount} STUDENTS APPROVED`}
            size="small"
            icon={<PeopleAltOutlined style={{ fontSize: 13 }} />}
            sx={{
              mt: 0.8,
              height: 22,
              fontSize: "0.68rem",
              fontWeight: 700,
              bgcolor: "#EFF6FF",
              color: "#2563EB",
              "& .MuiChip-icon": { color: "#2563EB" },
            }}
          />
        </Box>

        {/* Export button */}
        <Box
          onClick={handleExport}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2.5,
            py: 1,
            borderRadius: "10px",
            border: "1.5px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            cursor: students.length ? "pointer" : "not-allowed",
            opacity: students.length ? 1 : 0.5,
            transition: "all 0.15s ease",
            "&:hover": students.length
              ? { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" }
              : {},
            userSelect: "none",
          }}
        >
          <DownloadOutlined sx={{ fontSize: 18, color: "#334155" }} />
          <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 600, color: "#334155" }}>
            Export to Excel
          </p>
        </Box>
      </Box>

      {/* ── Filter Bar ── */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          p: 2.5,
          mb: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "flex-end",
        }}
      >
        <FormControl size="small" sx={selectSx}>
          <InputLabel>Department</InputLabel>
          <Select value={department} label="Department" onChange={(e) => setDept(e.target.value)}>
            <MenuItem value="">All Departments</MenuItem>
            {allDepts.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ ...selectSx, minWidth: 130 }}>
          <InputLabel>Year</InputLabel>
          <Select value={year} label="Year" onChange={(e) => setYear(e.target.value)}>
            <MenuItem value="">All Years</MenuItem>
            {["1", "2", "3", "4"].map((y) => (
              <MenuItem key={y} value={y}>{YEAR_LABEL[y]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ ...selectSx, minWidth: 170 }}>
          <InputLabel>Route</InputLabel>
          <Select value={route} label="Route" onChange={(e) => setRoute(e.target.value)}>
            <MenuItem value="">All Routes</MenuItem>
            {allRoutes.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ ...selectSx, minWidth: 130 }}>
          <InputLabel>Shift</InputLabel>
          <Select value={shift} label="Shift" onChange={(e) => setShift(e.target.value)}>
            <MenuItem value="">All Shifts</MenuItem>
            {["7:30", "9:30", "10:30"].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Apply Filters */}
        <Box
          onClick={handleApply}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.8,
            px: 2.5,
            py: 1,
            borderRadius: "10px",
            bgcolor: "#2563EB",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.83rem",
            transition: "background 0.15s ease",
            "&:hover": { bgcolor: "#1D4ED8" },
            userSelect: "none",
            height: 40,
          }}
        >
          <FilterListOutlined sx={{ fontSize: 16 }} />
          Apply Filters
        </Box>

        {/* Reset */}
        {Object.keys(appliedFilters).length > 0 && (
          <Tooltip title="Reset filters">
            <IconButton
              onClick={handleReset}
              size="small"
              sx={{
                bgcolor: "#F1F5F9",
                borderRadius: "10px",
                width: 40,
                height: 40,
                "&:hover": { bgcolor: "#E2E8F0" },
              }}
            >
              <RestartAltOutlined sx={{ fontSize: 18, color: "#64748B" }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ── Error ── */}
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: "#FEF2F2", borderRadius: "10px", border: "1px solid #FECACA" }}>
          <p style={{ margin: 0, color: "#DC2626", fontSize: "0.85rem", fontWeight: 500 }}>{error}</p>
        </Box>
      )}

      {/* ── Table ── */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "2.5fr 1.4fr 1.4fr 0.9fr 1fr 110px",
            px: 3,
            py: 1.5,
            borderBottom: "1px solid #F1F5F9",
            bgcolor: "#FAFAFA",
            gap: 2,
          }}
        >
          {colHdr("Student Name")}
          {colHdr("Pickup Point")}
          {colHdr("Shift")}
          {colHdr("Year")}
          {colHdr("Department")}
          <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.09em", textAlign: "right" }}>Actions</p>
        </Box>

        {/* Loading skeletons */}
        {loading && (
          <Box sx={{ p: 3 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box
                key={i}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2.5fr 1.4fr 1.4fr 0.9fr 1fr 110px",
                  gap: 2,
                  py: 1.5,
                  borderBottom: "1px solid #F8FAFC",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Skeleton variant="rounded" width={38} height={38} />
                  <Box>
                    <Skeleton width={120} height={16} />
                    <Skeleton width={80} height={13} sx={{ mt: 0.4 }} />
                  </Box>
                </Box>
                <Skeleton width={90} height={16} />
                <Skeleton width={60} height={22} sx={{ borderRadius: "6px" }} />
                <Skeleton width={55} height={16} />
                <Skeleton width={130} height={16} />
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="circular" width={32} height={32} />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Rows */}
        {!loading && students.length === 0 && (
          <Box
            sx={{
              py: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              color: "#94A3B8",
            }}
          >
            <PeopleAltOutlined sx={{ fontSize: 40, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>No approved students found</p>
            {Object.keys(appliedFilters).length > 0 && (
              <p style={{ margin: 0, fontSize: "0.78rem" }}>Try clearing your filters</p>
            )}
          </Box>
        )}

        {!loading && students.map((student, idx) => {
          const isLast = idx === students.length - 1;
          const initials = student.fullName
            ? student.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
            : "?";
          const isReprintingThis = reprintLoading === student.receiptNumber;

          return (
            <Box
              key={student._id || student.receiptNumber}
              sx={{
                display: "grid",
                gridTemplateColumns: "2.5fr 1.4fr 1.4fr 0.9fr 1fr 110px",
                gap: 2,
                px: 3,
                py: 1.5,
                alignItems: "center",
                borderBottom: isLast ? "none" : "1px solid #F8FAFC",
                transition: "background 0.1s ease",
                "&:hover": { bgcolor: "#FAFAFA" },
              }}
            >
              {/* Col 1: Student name + photo + phone */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                <Avatar
                  src={student.photoUrl}
                  alt={student.fullName}
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "10px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    bgcolor: "#EFF6FF",
                    color: "#2563EB",
                    flexShrink: 0,
                    border: "1.5px solid #E2E8F0",
                  }}
                  variant="rounded"
                >
                  {initials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#0F172A",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {student.fullName}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.72rem",
                      color: "#64748B",
                      fontWeight: 500,
                    }}
                  >
                    {student.mobile || "—"}
                  </p>
                </Box>
              </Box>

              {/* Col 2: Pickup Point */}
              <p
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "#334155",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {student.pickupPoint?.label || "—"}
              </p>

              {/* Col 3: Shift */}
              <Box>
                {student.shift ? (
                  <Chip
                    label={student.shift}
                    size="small"
                    sx={shiftChipSx(student.shift)}
                  />
                ) : (
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#CBD5E1" }}>—</p>
                )}
              </Box>

              {/* Col 4: Year */}
              <p
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "#334155",
                  fontWeight: 500,
                }}
              >
                {YEAR_LABEL[student.year] || `Year ${student.year}`}
              </p>

              {/* Col 5: Department */}
              <p
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "#334155",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {student.department?.label || "—"}
              </p>

              {/* Col 6: Actions */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                {/* Edit */}
                <Tooltip title="Edit student record" placement="left">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(student)}
                    sx={{
                      width: 32, height: 32, borderRadius: "8px",
                      bgcolor: "#FFF7ED", color: "#EA580C",
                      "&:hover": { bgcolor: "#FFEDD5" },
                      transition: "all 0.15s ease",
                    }}
                  >
                    <EditOutlined sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
                {/* Print */}
                <Tooltip title={`Reprint receipt ${student.receiptNumber}`} placement="left">
                  <IconButton
                    size="small"
                    onClick={() => handleReprint(student)}
                    disabled={isReprintingThis}
                    sx={{
                      width: 32, height: 32, borderRadius: "8px",
                      bgcolor: isReprintingThis ? "#F1F5F9" : "#EFF6FF",
                      color: "#2563EB",
                      "&:hover": { bgcolor: "#DBEAFE" },
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isReprintingThis ? (
                      <CircularProgress size={14} sx={{ color: "#2563EB" }} />
                    ) : (
                      <PrintOutlined sx={{ fontSize: 15 }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          );
        })}

        {/* Load More */}
        {!loading && hasMore && (
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "center",
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <Box
              onClick={handleLoadMore}
              sx={{
                cursor: loadingMore ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#2563EB",
                userSelect: "none",
                opacity: loadingMore ? 0.6 : 1,
                "&:hover": { color: "#1D4ED8" },
                transition: "color 0.15s ease",
              }}
            >
              {loadingMore ? (
                <>
                  <CircularProgress size={14} sx={{ color: "#2563EB" }} />
                  Loading…
                </>
              ) : (
                <>Load More Students ({totalCount - students.length} remaining)</>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Receipt Dialog for reprinting */}
      <ReceiptDialog
        open={receiptOpen}
        receiptData={receiptData}
        onClose={() => { setReceiptOpen(false); setReceiptData(null); }}
      />

      {/* Edit Approved Student Modal */}
      <EditApprovedStudentModal
        open={editOpen}
        student={editStudent}
        onClose={() => { setEditOpen(false); setEditStudent(null); }}
        onSaved={handleEditSaved}
      />
    </Box>
  );
}
