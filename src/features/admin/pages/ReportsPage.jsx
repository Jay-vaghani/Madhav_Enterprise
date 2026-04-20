import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import {
  PersonAddAltOutlined,
  AccountBalanceWalletOutlined,
  CurrencyRupeeOutlined,
  TrendingUpOutlined,
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
import { fetchAnalytics } from "../../../api/admin/api";
import { useAuth } from "../context/AuthContext";

// ── Formatting helpers ──────────────────────────────────────────
const fmtCurrency = (n) => {
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
      <p style={{ margin: 0, fontSize: "0.7rem", color: "#94A3B8" }}>
        {label}
      </p>
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
        minWidth: 180,
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

  // ── Filters ─────────────────────────────────────────────────
  const [period, setPeriod] = useState("weekly");
  const [year, setYear] = useState("");
  const [shift, setShift] = useState("");
  const [department, setDepartment] = useState("");

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

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ── Chart bar max for highlight ─────────────────────────────
  const maxCount = Math.max(...trends.map((t) => t.count), 0);

  return (
    <Box sx={{ maxWidth: 1200 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "1.55rem",
            fontWeight: 800,
            color: "#0F172A",
            lineHeight: 1.3,
          }}
        >
          Reports & Analytics
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

      {/* Filter Bar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
          p: 2.5,
          bgcolor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
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
            minHeight: 300,
          }}
        >
          <CircularProgress size={36} sx={{ color: "#2563EB" }} />
        </Box>
      )}

      {!loading && stats && (
        <>
          {/* Stat Cards */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <StatCard
              icon={PersonAddAltOutlined}
              label="Today's Registrations"
              value={stats.todayRegistrations}
              iconColor="#2563EB"
            />
            <StatCard
              icon={AccountBalanceWalletOutlined}
              label="Total Fees Collected"
              value={fmtCurrency(stats.totalFeesCollected)}
              subtitle={`Acc A: ${fmtCompact(stats.accountA)} | Acc B: ${fmtCompact(stats.accountB)}`}
              iconColor="#059669"
            />
            <StatCard
              icon={CurrencyRupeeOutlined}
              label="Cash Collected"
              value={fmtCurrency(stats.totalCash)}
              subtitle={`${stats.totalApproved} total students`}
              iconColor="#F59E0B"
            />
            <StatCard
              icon={TrendingUpOutlined}
              label="Net Revenue"
              value={fmtCurrency(stats.netRevenue)}
              subtitle={`Approved: ${stats.totalApproved}`}
              accent
              iconColor="#fff"
            />
          </Box>

          {/* Chart Section */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              p: 3,
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
                      color:
                        period === p.value ? "#2563EB" : "#64748B",
                      bgcolor:
                        period === p.value ? "#fff" : "transparent",
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
                        fill={
                          entry.count === maxCount
                            ? "#2563EB"
                            : "#BFDBFE"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
