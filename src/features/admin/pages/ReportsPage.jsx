import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  PersonAddAltOutlined,
  AccountBalanceWalletOutlined,
  CurrencyRupeeOutlined,
  TrendingUpOutlined,
  CalendarTodayOutlined,
  SearchOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  FileDownloadOutlined,
  CalendarMonthOutlined,
  TableChartOutlined,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fetchAnalytics, fetchApprovedStudents } from "../../../api/admin/api";
import { useAuth } from "../context/AuthContext";
import XLSX from "xlsx-js-style";

// ── Formatting helpers ──────────────────────────────────────────
const fmtCurrency = (n, show = true) => {
  if (!show) return "₹ ****";
  if (!n && n !== 0) return "₹0";
  return `₹${Number(n).toLocaleString("en-IN")}`;
};

const fmtCompact = (n) => {
  if (!n && n !== 0) return "₹0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

// ── Data for filter dropdowns ───────────────────────────────────
const SHIFTS = [
  { value: "", label: "All Shifts" },
  { value: "Morning", label: "Morning" },
  { value: "Afternoon", label: "Afternoon" },
];

const YEARS = [
  { value: "", label: "All Years" },
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

const DEPARTMENTS = [
  { value: "", label: "All Departments" },
  { value: "Computer Engineering", label: "Computer Engineering" },
  { value: "Information Technology", label: "Information Technology" },
  { value: "Civil Engineering", label: "Civil Engineering" },
  { value: "Mechanical Engineering", label: "Mechanical Engineering" },
  { value: "Electrical Engineering", label: "Electrical Engineering" },
  { value: "Chemical Engineering", label: "Chemical Engineering" },
  { value: "BBA", label: "BBA" },
  { value: "BCA", label: "BCA" },
  { value: "B.Sc.", label: "B.Sc." },
  { value: "B.Com.", label: "B.Com." },
  { value: "Diploma", label: "Diploma" },
  { value: "MBA", label: "MBA" },
  { value: "M.Sc.", label: "M.Sc." },
  { value: "Pharmacy", label: "Pharmacy" },
  { value: "Physiotherapy", label: "Physiotherapy" },
  { value: "Nursing", label: "Nursing" },
];

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// ── Generate month-wise export ranges ──────────────────────────
// Builds a list like "1 to 30/04/2027", "1 to 31/05/2027", ...
// covering from Oct 2025 (system start) up to current month.
const buildExportMonths = () => {
  const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = (m, y) => (m === 2 && isLeap(y) ? 29 : MONTH_DAYS[m - 1]);
  const pad = (n) => String(n).padStart(2, "0");

  const months = [];
  const now = new Date();
  const endYear = now.getFullYear() + 2; // e.g. if 2026, generate up to end of 2028

  let y = 2026,
    m = 4; // Start from April 2026

  while (y < endYear || (y === endYear && m <= 12)) {
    const lastDay = daysInMonth(m, y);
    const label = `01/${pad(m)}/${y} to ${lastDay}/${pad(m)}/${y}`;
    // YYYY-MM-01 and YYYY-MM-lastDay for API
    const fromDate = `${y}-${pad(m)}-01`;
    const toDate = `${y}-${pad(m)}-${pad(lastDay)}`;
    months.push({ label, fromDate, toDate });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months; // chronological order
};

const EXPORT_MONTHS = buildExportMonths();

// ── Custom chart tooltip ────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "#0F172A",
        color: "#fff",
        px: 1.5,
        py: 1,
        borderRadius: "8px",
        fontSize: "0.8rem",
        fontWeight: 600,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.7rem", color: "#94A3B8" }}>{label}</p>
      <p style={{ margin: 0 }}>{payload[0].value} registrations</p>
    </Box>
  );
};

// ── Stat card component ─────────────────────────────────────────
function StatCard({ icon: Icon, label, value, subtitle, accent, iconColor }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: { xs: 0, sm: 180 },
        bgcolor: accent ? "#2563EB" : "#FFFFFF",
        borderRadius: "14px",
        border: accent ? "none" : "1px solid #E2E8F0",
        p: 2.5,
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: accent
            ? "0 8px 24px rgba(37,99,235,0.3)"
            : "0 4px 16px rgba(0,0,0,0.06)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Icon chip */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 32,
          height: 32,
          borderRadius: "8px",
          bgcolor: accent ? "rgba(255,255,255,0.2)" : `${iconColor}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          sx={{
            fontSize: 18,
            color: accent ? "#fff" : iconColor,
          }}
        />
      </Box>

      <p
        style={{
          margin: 0,
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: accent ? "rgba(255,255,255,0.75)" : "#64748B",
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "1.65rem",
          fontWeight: 800,
          color: accent ? "#fff" : "#0F172A",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {subtitle && (
        <p
          style={{
            margin: "6px 0 0 0",
            fontSize: "0.72rem",
            fontWeight: 500,
            color: accent ? "rgba(255,255,255,0.65)" : "#94A3B8",
          }}
        >
          {subtitle}
        </p>
      )}
    </Box>
  );
}

// ── Select styling ──────────────────────────────────────────────
const selectSx = {
  minWidth: 150,
  "& .MuiOutlinedInput-root": {
    height: 42,
    borderRadius: "10px",
    fontSize: "0.85rem",
    bgcolor: "#fff",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#E2E8F0",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#CBD5E1",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#64748B",
  },
};

// ═══════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const { token } = useAuth();
  const [showRevenue, setShowRevenue] = useState(false);

  // ── Export menu state ────────────────────────────────────────
  const [exportAnchor, setExportAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);

  // ── Export helpers ───────────────────────────────────────────
  const YEAR_LABEL = {
    1: "1st Year",
    2: "2nd Year",
    3: "3rd Year",
    4: "4th Year",
  };
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";
  const SHIFT_FORMAT_MAP = {
    "1-shift": "1st (07:30 AM)",
    "2-shift": "2nd (09:30 AM)",
    "3-shift": "3rd (11:30 AM)",
    "1st": "1st (07:30 AM)",
    "2nd": "2nd (09:30 AM)",
    "3rd": "3rd (11:30 AM)",
    "7:30": "1st (07:30 AM)",
    "9:30": "2nd (09:30 AM)",
    "10:30": "3rd (11:30 AM)",
    "11:30": "3rd (11:30 AM)",
  };

  const formatShift = (shift) => {
    if (!shift) return "";
    const sStr = typeof shift === "object" ? shift.label || "" : String(shift);
    if (!sStr) return "";
    
    if (SHIFT_FORMAT_MAP[sStr]) return SHIFT_FORMAT_MAP[sStr];
    
    const s = sStr.toLowerCase();
    if (s.startsWith("1-shift") || s.includes("1st") || s.includes("7:30"))
      return "1st (07:30 AM)";
    if (s.startsWith("2-shift") || s.includes("2nd") || s.includes("9:30"))
      return "2nd (09:30 AM)";
    if (
      s.startsWith("3-shift") ||
      s.includes("3rd") ||
      s.includes("10:30") ||
      s.includes("11:30")
    )
      return "3rd (11:30 AM)";
    return sStr;
  };

  const buildRows = (students) =>
    [...students]
      .sort((a, b) => {
        const tA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
        const tB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
        const timeA = isNaN(tA) ? 0 : tA;
        const timeB = isNaN(tB) ? 0 : tB;
        if (timeA !== timeB) return timeA - timeB;
        return (a.receiptNumber || "").localeCompare(
          b.receiptNumber || "",
          undefined,
          { numeric: true },
        );
      })
      .map((s) => {
        const p = s.payment || {};
        const pm = p.paymentMethod;
        const cashAmt =
          pm === "cash" || pm === "both" ? p.cashAmount || p.amount || 0 : "";
        const bankAmt =
          pm === "bank" || pm === "both" ? p.bankAmount || p.amount || 0 : "";
        const txns = [p.transaction1, p.transaction2]
          .filter(Boolean)
          .join(" || ");
        let accountLabel = "";
        if (pm === "cash") accountLabel = "Cash";
        else if (pm === "bank")
          accountLabel =
            p.settlementAccount === "C" ? "Account C" : "Account H";
        else if (pm === "both")
          accountLabel = `${p.settlementAccount === "C" ? "Account C" : "Account H"}, Cash`;
        return {
          "Date of Approval": fmtDate(s.approvedAt),
          "Receipt No.": s.receiptNumber,
          "Full Name": s.fullName,
          Year: YEAR_LABEL[s.year] || s.year,
          Department: s.department?.label || s.department || "",
          Semester: s.semester || "",
          Shift: formatShift(s.shift),
          "Pickup Point": s.pickupPoint?.label || s.pickupPoint || "",
          "Total Fees": p.amount || "",
          CASH: cashAmt,
          BANK: bankAmt,
          "Payment Mode": pm ? pm.charAt(0).toUpperCase() + pm.slice(1) : "",
          "Transaction IDs": txns,
          "Validity Date": fmtDate(s.validityDate),
          "Parents Phone": s.guardianMobile || "",
          "Student Phone": s.mobile || "",
          ImageUrl: s.photoUrl || "",
          "Enrollment Number": s.enrollmentNumber || "",
          Account: accountLabel,
        };
      });

  const writeXlsx = (rows, filename) => {
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const headers = Object.keys(rows[0]);
    const BLUE = "2563EB",
      WHITE = "FFFFFF",
      BORDER_COLOR = "E2E8F0",
      STRIPE = "F8FAFC",
      DARK_TEXT = "0F172A";
    const headerStyle = {
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: WHITE } },
      fill: { fgColor: { rgb: BLUE }, patternType: "solid" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: BLUE } },
        bottom: { style: "thin", color: { rgb: BLUE } },
        left: { style: "thin", color: { rgb: BLUE } },
        right: { style: "thin", color: { rgb: BLUE } },
      },
    };
    const dataStyleEven = {
      font: { name: "Calibri", sz: 10, color: { rgb: DARK_TEXT } },
      fill: { fgColor: { rgb: WHITE }, patternType: "solid" },
      alignment: { vertical: "center", wrapText: false },
      border: {
        top: { style: "thin", color: { rgb: BORDER_COLOR } },
        bottom: { style: "thin", color: { rgb: BORDER_COLOR } },
        left: { style: "thin", color: { rgb: BORDER_COLOR } },
        right: { style: "thin", color: { rgb: BORDER_COLOR } },
      },
    };
    const dataStyleOdd = {
      ...dataStyleEven,
      fill: { fgColor: { rgb: STRIPE }, patternType: "solid" },
    };
    const currencyStyle = {
      font: { name: "Calibri", sz: 10, color: { rgb: DARK_TEXT } },
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: "#,##0",
    };
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cellRef]) ws[cellRef].s = headerStyle;
    }
    const currencyCols = ["Total Fees", "CASH", "BANK"];
    for (let r = 1; r <= rows.length; r++) {
      const isOdd = r % 2 === 1;
      const baseStyle = isOdd ? dataStyleOdd : dataStyleEven;
      for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (ws[cellRef])
          ws[cellRef].s = currencyCols.includes(headers[c])
            ? { ...baseStyle, ...currencyStyle }
            : baseStyle;
      }
    }
    ws["!cols"] = headers.map((h) => {
      if (h === "ImageUrl") return { wch: 45 };
      if (h === "Transaction IDs") return { wch: 28 };
      if (["Full Name", "Pickup Point"].includes(h)) return { wch: 22 };
      if (h === "Department") return { wch: 18 };
      if (["Parents Phone", "Student Phone"].includes(h)) return { wch: 15 };
      if (["Date of Approval", "Validity Date"].includes(h)) return { wch: 14 };
      if (["Receipt No.", "Enrollment Number"].includes(h)) return { wch: 14 };
      if (h === "Account") return { wch: 18 };
      if (currencyCols.includes(h)) return { wch: 12 };
      return { wch: 13 };
    });
    ws["!rows"] = [{ hpx: 32 }, ...Array(rows.length).fill({ hpx: 22 })];
    ws["!freeze"] = {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: "A2",
      activePane: "bottomLeft",
    };
    const range = XLSX.utils.decode_range(ws["!ref"]);
    ws["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Approved Students");
    XLSX.writeFile(wb, filename);
  };

  const handleExportAll = async () => {
    setExportAnchor(null);
    setExporting(true);
    try {
      const res = await fetchApprovedStudents(token, { limit: 9999, page: 1 });
      if (res.success) {
        if (!res.data || res.data.length === 0) {
          alert("No student data found.");
          return;
        }
        writeXlsx(
          buildRows(res.data),
          `All_Students_${new Date().toISOString().slice(0, 10)}.xlsx`,
        );
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportMonth = async ({ fromDate, toDate, label }) => {
    setExportAnchor(null);
    setExporting(true);
    try {
      const res = await fetchApprovedStudents(token, {
        limit: 9999,
        page: 1,
        approvedDateFrom: fromDate,
        approvedDateTo: toDate,
      });
      if (res.success) {
        if (!res.data || res.data.length === 0) {
          alert(`No approved students found for ${label}.`);
          return;
        }
        const safeName = label.replace(/[/\\:*?"<>|]/g, "-");
        writeXlsx(buildRows(res.data), `Students_${safeName}.xlsx`);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  // ── Filters ─────────────────────────────────────────────────
  const [period, setPeriod] = useState("daily");
  const [year, setYear] = useState("");
  const [shift, setShift] = useState("");
  const [department, setDepartment] = useState("");

  // ── Date range for Collection Insights (defaults: start of month → today) ──
  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfMonthStr = (() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();

  // ── Date-wise Collection section — single date, defaults to today ──
  const [dwDate, setDwDate] = useState(todayStr);
  const [dwLoading, setDwLoading] = useState(false);
  const [dwStats, setDwStats] = useState(null);

  // ── Data ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);

  // ── Fetch ───────────────────────────────────────────────────
  const loadAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const filters = { period };
      if (year) filters.year = year;
      if (shift) filters.shift = shift;
      if (department) filters.department = department;

      const res = await fetchAnalytics(token, filters);
      if (res.success) {
        setStats(res.data.stats);
        setTrends(res.data.trends);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, period, year, shift, department]);

  // ── Date-wise Collection fetch (independent) ─────────────────
  const loadDatewiseCollection = useCallback(async () => {
    if (!token) return;
    setDwLoading(true);
    try {
      const res = await fetchAnalytics(token, {
        fromDate: dwDate,
        toDate: dwDate,
      });
      if (res.success) setDwStats(res.data.stats);
    } catch (err) {
      console.error("Date-wise collection fetch error:", err);
    } finally {
      setDwLoading(false);
    }
  }, [token, dwDate]);

  useEffect(() => {
    loadDatewiseCollection();
  }, [loadDatewiseCollection]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ── Chart bar max for highlight ─────────────────────────────
  const maxCount = Math.max(...trends.map((t) => t.count), 0);

  // ── Revenue Percentages ─────────────────────────────────────
  let onlinePct = 0;
  let cashPct = 0;
  let onlineTotal = 0;
  let cashTotal = 0;
  if (stats) {
    onlineTotal = (stats.accountA || 0) + (stats.accountB || 0);
    cashTotal = stats.totalCash || 0;
    const totalRev = stats.netRevenue || onlineTotal + cashTotal;
    if (totalRev > 0) {
      onlinePct = ((onlineTotal / totalRev) * 100)
        .toFixed(1)
        .replace(/\.0$/, "");
      cashPct = ((cashTotal / totalRev) * 100).toFixed(1).replace(/\.0$/, "");
    }
  }

  // ── Date-wise Percentages ───────────────────────────────────
  let dwOnlinePct = 0;
  let dwCashPct = 0;
  let dwOnlineTotal = 0;
  let dwCashTotal = 0;
  if (dwStats) {
    dwOnlineTotal =
      (dwStats.rangedAccountA || 0) + (dwStats.rangedAccountB || 0);
    dwCashTotal = dwStats.rangedTotalCash || 0;
    const dwTotalRev = dwStats.rangedNetRevenue || dwOnlineTotal + dwCashTotal;
    if (dwTotalRev > 0) {
      dwOnlinePct = ((dwOnlineTotal / dwTotalRev) * 100)
        .toFixed(1)
        .replace(/\.0$/, "");
      dwCashPct = ((dwCashTotal / dwTotalRev) * 100)
        .toFixed(1)
        .replace(/\.0$/, "");
    }
  }

  return (
    <Box sx={{ maxWidth: 1200 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
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
              lineHeight: 1.3,
            }}
          >
            Reports &amp; Analytics
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.85rem",
              color: "#64748B",
              fontWeight: 500,
            }}
          >
            Comprehensive view of registration and financial metrics.
          </p>
        </Box>

        {/* Export Button */}
        <Box>
          <Button
            id="export-btn"
            variant="contained"
            startIcon={
              exporting ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : (
                <FileDownloadOutlined />
              )
            }
            disabled={exporting}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(135deg, #0F172A, #1E293B)",
              px: 2.5,
              py: 1,
              boxShadow: "0 4px 12px rgba(15,23,42,0.25)",
              "&:hover": {
                background: "linear-gradient(135deg, #1E293B, #334155)",
              },
            }}
          >
            {exporting ? "Exporting…" : "Export Excel"}
          </Button>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              sx: {
                borderRadius: "14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                border: "1px solid #E2E8F0",
                minWidth: 240,
                mt: 1,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.25 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  color: "#94A3B8",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Download Options
              </p>
            </Box>
            <MenuItem
              onClick={handleExportAll}
              sx={{ py: 1.25, px: 2, "&:hover": { bgcolor: "#EFF6FF" } }}
            >
              <ListItemIcon>
                <TableChartOutlined sx={{ color: "#2563EB", fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="All Data"
                secondary="Complete student records"
                primaryTypographyProps={{
                  fontWeight: 700,
                  fontSize: "0.875rem",
                }}
                secondaryTypographyProps={{ fontSize: "0.75rem" }}
              />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <Box sx={{ px: 2, py: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  color: "#94A3B8",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Month-wise by Approved Date
              </p>
            </Box>
            <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
              {EXPORT_MONTHS.map((m) => (
                <MenuItem
                  key={m.label}
                  onClick={() => handleExportMonth(m)}
                  sx={{ py: 1, px: 2, "&:hover": { bgcolor: "#F0FDF4" } }}
                >
                  <ListItemIcon>
                    <CalendarMonthOutlined
                      sx={{ color: "#10B981", fontSize: 18 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={m.label}
                    primaryTypographyProps={{
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                  />
                </MenuItem>
              ))}
            </Box>
          </Menu>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 4,
          p: 2,
          bgcolor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <FormControl size="small" sx={selectSx}>
          <InputLabel>Shift</InputLabel>
          <Select
            value={shift}
            label="Shift"
            onChange={(e) => setShift(e.target.value)}
          >
            {SHIFTS.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={selectSx}>
          <InputLabel>Year</InputLabel>
          <Select
            value={year}
            label="Year"
            onChange={(e) => setYear(e.target.value)}
          >
            {YEARS.map((y) => (
              <MenuItem key={y.value} value={y.value}>
                {y.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ ...selectSx, minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={department}
            label="Department"
            onChange={(e) => setDepartment(e.target.value)}
          >
            {DEPARTMENTS.map((d) => (
              <MenuItem key={d.value} value={d.value}>
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress size={40} thickness={4} sx={{ color: "#2563EB" }} />
        </Box>
      )}

      {!loading && stats && (
        <>
          {/* ── Main Stats Dashboard ── */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Small Metrics */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  height: "100%",
                }}
              >
                <StatCard
                  icon={PersonAddAltOutlined}
                  label="Today's Enrollments"
                  value={stats.todayRegistrations}
                  subtitle="New student registrations today"
                  iconColor="#2563EB"
                />
                <StatCard
                  icon={CurrencyRupeeOutlined}
                  label="Total Students"
                  value={stats.totalApproved}
                  subtitle="Active approved records"
                  iconColor="#8B5CF6"
                />
              </Box>
            </Grid>

            {/* Hero Net Revenue Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  height: "100%",
                  background:
                    "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
                  borderRadius: "20px",
                  p: 3,
                  color: "white",
                  boxShadow: "0 10px 25px rgba(37,99,235,0.2)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      opacity: 0.8,
                    }}
                  >
                    Net Revenue (Total)
                  </p>
                  <IconButton
                    size="small"
                    onClick={() => setShowRevenue(!showRevenue)}
                    sx={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    {showRevenue ? (
                      <VisibilityOffOutlined fontSize="small" />
                    ) : (
                      <VisibilityOutlined fontSize="small" />
                    )}
                  </IconButton>
                </Box>
                <p
                  style={{
                    margin: "4px 0",
                    fontSize: "2.4rem",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {fmtCurrency(stats.netRevenue, showRevenue)}
                </p>
                <Box
                  sx={{
                    mt: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <TrendingUpOutlined sx={{ fontSize: 16, opacity: 0.8 }} />
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      opacity: 0.9,
                    }}
                  >
                    Combined institutional collections
                  </p>
                </Box>

                <Box sx={{ mt: 3.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#38BDF8",
                          boxShadow: "0 0 8px rgba(56,189,248,0.5)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                          color: "rgba(255,255,255,0.8)",
                        }}
                      >
                        ONLINE
                      </span>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          ml: 0.5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 800,
                            color: "#fff",
                            lineHeight: 1,
                          }}
                        >
                          {onlinePct}%
                        </span>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.7)",
                            marginTop: "2px",
                          }}
                        >
                          {fmtCurrency(onlineTotal, showRevenue)}
                        </span>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          mr: 0.5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 800,
                            color: "#fff",
                            lineHeight: 1,
                          }}
                        >
                          {cashPct}%
                        </span>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.7)",
                            marginTop: "2px",
                          }}
                        >
                          {fmtCurrency(cashTotal, showRevenue)}
                        </span>
                      </Box>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                          color: "rgba(255,255,255,0.8)",
                        }}
                      >
                        CASH
                      </span>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#34D399",
                          boxShadow: "0 0 8px rgba(52,211,153,0.5)",
                        }}
                      />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      width: "100%",
                      height: 6,
                      bgcolor: "rgba(0,0,0,0.25)",
                      borderRadius: 3,
                      display: "flex",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${onlinePct}%`,
                        background: "#38BDF8",
                        transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    <Box
                      sx={{
                        width: `${cashPct}%`,
                        background: "#34D399",
                        transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* ── Collection Insights Breakdown (all-time) ── */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 18,
                  bgcolor: "#2563EB",
                  borderRadius: 1,
                }}
              />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: "#1E293B",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Collection Insights
              </h3>
            </Box>

            <Grid container spacing={2}>
              {[
                {
                  label: "Account C",
                  val: stats.accountA,
                  color: "#3B82F6",
                  bg: "#EFF6FF",
                  icon: AccountBalanceWalletOutlined,
                },
                {
                  label: "Account H",
                  val: stats.accountB,
                  color: "#8B5CF6",
                  bg: "#F5F3FF",
                  icon: AccountBalanceWalletOutlined,
                },
                {
                  label: "Cash Collection",
                  val: stats.totalCash,
                  color: "#10B981",
                  bg: "#ECFDF5",
                  icon: CurrencyRupeeOutlined,
                },
              ].map((item) => (
                <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
                  <Box
                    sx={{
                      bgcolor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "16px",
                      p: 2.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        borderColor: item.color,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        bgcolor: item.bg,
                        color: item.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <item.icon sx={{ fontSize: 22 }} />
                    </Box>
                    <Box>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "1.25rem",
                          fontWeight: 800,
                          color: "#1E293B",
                        }}
                      >
                        {fmtCurrency(item.val, showRevenue)}
                      </p>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Chart Section */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              p: 3,
              mb: 4,
            }}
          >
            {/* Chart header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 3,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#0F172A",
                  }}
                >
                  Registration Trends
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.8rem",
                    color: "#94A3B8",
                    fontWeight: 500,
                  }}
                >
                  Student enrollment volume over time.
                </p>
              </Box>

              {/* Period toggle */}
              <Box
                sx={{
                  display: "flex",
                  bgcolor: "#F1F5F9",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #E2E8F0",
                }}
              >
                {PERIODS.map((p) => (
                  <Box
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    sx={{
                      px: 2,
                      py: 0.8,
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      fontWeight: period === p.value ? 700 : 500,
                      color: period === p.value ? "#2563EB" : "#64748B",
                      bgcolor: period === p.value ? "#fff" : "transparent",
                      borderRadius: period === p.value ? "8px" : 0,
                      boxShadow:
                        period === p.value
                          ? "0 1px 3px rgba(0,0,0,0.1)"
                          : "none",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        color: "#2563EB",
                      },
                    }}
                  >
                    {p.label}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Chart */}
            {trends.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 280,
                  color: "#94A3B8",
                  fontSize: "0.85rem",
                }}
              >
                No data available for selected filters
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={trends}
                  margin={{ top: 5, right: 10, left: -15, bottom: 5 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F1F5F9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94A3B8",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94A3B8",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                    allowDecimals={false}
                    dx={-5}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(37,99,235,0.04)" }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {trends.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count === maxCount ? "#2563EB" : "#BFDBFE"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>

          {/* ══════════════════════════════════════════════════════
               DATE-WISE COLLECTION — completely separate section
          ══════════════════════════════════════════════════════ */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              p: 3,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            {/* Section header */}
            <Box
              sx={{
                display: "flex",
                alignItems: { xs: "flex-start", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 18,
                    bgcolor: "#F59E0B",
                    borderRadius: 1,
                  }}
                />
                <Box>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      color: "#1E293B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Date-wise Collection
                  </h3>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "0.75rem",
                      color: "#94A3B8",
                      fontWeight: 500,
                    }}
                  >
                    View Account C, Account H & Cash collected in any date range
                  </p>
                </Box>
              </Box>

              {/* Single date picker */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <TextField
                  type="date"
                  size="small"
                  label="Date"
                  value={dwDate}
                  onChange={(e) => setDwDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayOutlined
                          sx={{ fontSize: 14, color: "#94A3B8" }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: 175,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      fontSize: "0.82rem",
                      bgcolor: "#FFFBEB",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FDE68A",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#F59E0B",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#92400E",
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Results */}
            {dwLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress
                  size={32}
                  thickness={4}
                  sx={{ color: "#F59E0B" }}
                />
              </Box>
            ) : dwStats ? (
              <>
                {/* Date label badge */}
                <Box sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      bgcolor: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      borderRadius: "8px",
                      px: 1.5,
                      py: 0.6,
                    }}
                  >
                    <CalendarTodayOutlined
                      sx={{ fontSize: 13, color: "#D97706" }}
                    />
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#92400E",
                      }}
                    >
                      {new Date(dwDate + "T00:00:00").toLocaleDateString(
                        "en-IN",
                        {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </Box>
                </Box>

                {/* 4 metric cards: 3 sources + total */}
                <Grid container spacing={2}>
                  {[
                    {
                      label: "Account C",
                      val: dwStats.rangedAccountA,
                      color: "#3B82F6",
                      bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
                      border: "#BFDBFE",
                      icon: AccountBalanceWalletOutlined,
                    },
                    {
                      label: "Account H",
                      val: dwStats.rangedAccountB,
                      color: "#8B5CF6",
                      bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
                      border: "#DDD6FE",
                      icon: AccountBalanceWalletOutlined,
                    },
                    {
                      label: "Cash",
                      val: dwStats.rangedTotalCash,
                      color: "#10B981",
                      bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
                      border: "#A7F3D0",
                      icon: CurrencyRupeeOutlined,
                    },
                    {
                      label: "Total Collected",
                      val: dwStats.rangedNetRevenue,
                      color: "#F59E0B",
                      bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
                      border: "#FDE68A",
                      icon: TrendingUpOutlined,
                      isTotalCard: true,
                    },
                  ].map((item) => (
                    <Grid
                      size={{ xs: 12, sm: 6, md: 3 }}
                      key={item.label}
                      sx={{ display: "flex" }}
                    >
                      <Box
                        sx={{
                          background: item.bg,
                          border: `1.5px solid ${item.border}`,
                          borderRadius: "14px",
                          p: 2.5,
                          width: "100%",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: `0 6px 20px ${item.color}20`,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 46,
                            height: 46,
                            borderRadius: "12px",
                            bgcolor: `${item.color}18`,
                            border: `1px solid ${item.color}30`,
                            color: item.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <item.icon sx={{ fontSize: 22 }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              color: item.color,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginBottom: 2,
                            }}
                          >
                            {item.label}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: item.isTotalCard ? "1.4rem" : "1.25rem",
                              fontWeight: 800,
                              color: "#1E293B",
                              lineHeight: 1.1,
                            }}
                          >
                            {fmtCurrency(item.val, showRevenue)}
                          </p>
                          {item.isTotalCard && (
                            <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    color: "#3B82F6",
                                    letterSpacing: "0.03em",
                                  }}
                                >
                                  ONLINE {dwOnlinePct}%
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                    color: "#475569",
                                  }}
                                >
                                  {fmtCurrency(dwOnlineTotal, showRevenue)}
                                </span>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    color: "#10B981",
                                    letterSpacing: "0.03em",
                                  }}
                                >
                                  CASH {dwCashPct}%
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                    color: "#475569",
                                  }}
                                >
                                  {fmtCurrency(dwCashTotal, showRevenue)}
                                </span>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </>
            ) : null}
          </Box>
        </>
      )}
    </Box>
  );
}
