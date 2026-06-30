import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  PeopleAltOutlined,
  AccountBalanceWalletOutlined,
  CurrencyRupeeOutlined,
  TrendingUpOutlined,
  PercentOutlined,
  SchoolOutlined,
  AccessTimeOutlined,
  LocationOnOutlined,
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
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { fetchStaffAnalytics } from "../../../api/admin/api";
import { useAuth } from "../../admin/context/AuthContext";

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

// ── Chart custom tooltip ────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "#0F172A",
        color: "#fff",
        px: 2,
        py: 1.5,
        borderRadius: "10px",
        fontSize: "0.8rem",
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        minWidth: 140,
      }}
    >
      <p style={{ margin: 0, fontSize: "0.7rem", color: "#94A3B8", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color }}>
          {p.name}: {fmtCurrency(p.value)}
        </p>
      ))}
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
        borderRadius: "16px",
        border: accent ? "none" : "1px solid #E2E8F0",
        p: 2.5,
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
        "&:hover": {
          boxShadow: accent
            ? "0 8px 24px rgba(37,99,235,0.3)"
            : "0 4px 16px rgba(0,0,0,0.06)",
          transform: "translateY(-2px)",
        },
      }}
    >
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
        <Icon sx={{ fontSize: 18, color: accent ? "#fff" : iconColor }} />
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

// ── Section heading component ───────────────────────────────────
function SectionHeading({ color, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
      <Box sx={{ width: 4, height: 18, bgcolor: color || "#2563EB", borderRadius: 1 }} />
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
        {children}
      </h3>
    </Box>
  );
}

// ── Horizontal bar chart item ───────────────────────────────────
function HBarItem({ label, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>{label}</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>{count}</span>
      </Box>
      <Box
        sx={{
          width: "100%",
          height: 8,
          bgcolor: "#F1F5F9",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${pct}%`,
            height: "100%",
            bgcolor: color || "#2563EB",
            borderRadius: 4,
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Box>
    </Box>
  );
}

// ── Pie chart colors ────────────────────────────────────────────
const STATUS_COLORS = {
  approved: "#10B981",
  submitted: "#F59E0B",
  pending: "#EF4444",
};

const ACCOUNT_COLORS = {
  C: "#3B82F6",
  H: "#8B5CF6",
  S: "#F59E0B",
  Cash: "#10B981",
};

// ═══════════════════════════════════════════════════════════════
export default function StaffAnalyticsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchStaffAnalytics(token);
      if (res.success) setData(res.data);
    } catch (err) {
      console.error("Staff analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress size={40} thickness={4} sx={{ color: "#2563EB" }} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <p style={{ color: "#64748B", fontSize: "0.95rem" }}>Failed to load analytics data.</p>
      </Box>
    );
  }

  const { staff, payments } = data;

  // Payment status pie data
  const statusPieData = payments.byStatus
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
      value: s.count,
      fill: STATUS_COLORS[s.status] || "#94A3B8",
    }));

  // Account breakdown pie data
  const accountPieData = Object.entries(payments.byAccount)
    .filter(([, v]) => v.total > 0)
    .map(([key, v]) => ({
      name: key === "Cash" ? "Cash" : `Account ${key}`,
      value: v.total,
      fill: ACCOUNT_COLORS[key] || "#94A3B8",
    }));

  // Maxes for horizontal bar charts
  const maxSchool = Math.max(...staff.bySchool.map((s) => s.count), 1);
  const maxPickup = Math.max(...staff.byPickup.map((p) => p.count), 1);

  // Chart bar highlight
  const maxTrendVal = Math.max(...payments.monthlyTrend.map((t) => t.collected), 0);

  // Revenue percentages for hero card
  const totalAccountRevenue =
    payments.byAccount.C.total +
    payments.byAccount.H.total +
    payments.byAccount.S.total +
    payments.byAccount.Cash.total;
  const onlineTotal = payments.byAccount.C.total + payments.byAccount.H.total + payments.byAccount.S.total;
  const cashTotal = payments.byAccount.Cash.total;
  const onlinePct = totalAccountRevenue > 0 ? ((onlineTotal / totalAccountRevenue) * 100).toFixed(1).replace(/\.0$/, "") : 0;
  const cashPct = totalAccountRevenue > 0 ? ((cashTotal / totalAccountRevenue) * 100).toFixed(1).replace(/\.0$/, "") : 0;

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
          Staff Analytics
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "0.85rem",
            color: "#64748B",
            fontWeight: 500,
          }}
        >
          Comprehensive view of staff transport and payment metrics.
        </p>
      </Box>

      {/* ── Summary Cards ──────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
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
              icon={PeopleAltOutlined}
              label="Active Staff"
              value={staff.active}
              subtitle={`${staff.total} total · ${staff.deactivated} deactivated`}
              iconColor="#2563EB"
            />
            <StatCard
              icon={PercentOutlined}
              label="Collection Rate"
              value={`${payments.collectionRate}%`}
              subtitle={`${payments.currentMonth.approved} of ${payments.currentMonth.total} this month`}
              iconColor="#10B981"
            />
          </Box>
        </Grid>

        {/* Hero Revenue Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
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
              Total Revenue Collected
            </p>
            <p
              style={{
                margin: "4px 0",
                fontSize: "2.4rem",
                fontWeight: 900,
                letterSpacing: "-0.02em",
              }}
            >
              {fmtCurrency(payments.totalCollected)}
            </p>
            <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUpOutlined sx={{ fontSize: 16, opacity: 0.8 }} />
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  opacity: 0.9,
                }}
              >
                {fmtCurrency(payments.totalPending)} still pending
              </p>
            </Box>

            {/* Online vs Cash bar */}
            {totalAccountRevenue > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8, height: 8, borderRadius: "50%",
                        bgcolor: "#38BDF8", boxShadow: "0 0 8px rgba(56,189,248,0.5)",
                      }}
                    />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.03em", color: "rgba(255,255,255,0.8)" }}>
                      ONLINE
                    </span>
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff" }}>{onlinePct}%</span>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff" }}>{cashPct}%</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.03em", color: "rgba(255,255,255,0.8)" }}>
                      CASH
                    </span>
                    <Box
                      sx={{
                        width: 8, height: 8, borderRadius: "50%",
                        bgcolor: "#34D399", boxShadow: "0 0 8px rgba(52,211,153,0.5)",
                      }}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: "100%", height: 6, bgcolor: "rgba(0,0,0,0.25)",
                    borderRadius: 3, display: "flex", overflow: "hidden",
                  }}
                >
                  <Box sx={{ width: `${onlinePct}%`, background: "#38BDF8", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  <Box sx={{ width: `${cashPct}%`, background: "#34D399", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* ── Account Collection Breakdown ───────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <SectionHeading color="#2563EB">Account Collection Breakdown</SectionHeading>
        <Grid container spacing={2}>
          {[
            { label: "Account C", val: payments.byAccount.C.total, count: payments.byAccount.C.count, color: "#3B82F6", bg: "#EFF6FF", icon: AccountBalanceWalletOutlined },
            { label: "Account H", val: payments.byAccount.H.total, count: payments.byAccount.H.count, color: "#8B5CF6", bg: "#F5F3FF", icon: AccountBalanceWalletOutlined },
            { label: "Account S", val: payments.byAccount.S.total, count: payments.byAccount.S.count, color: "#F59E0B", bg: "#FFFBEB", icon: AccountBalanceWalletOutlined },
            { label: "Cash", val: payments.byAccount.Cash.total, count: payments.byAccount.Cash.count, color: "#10B981", bg: "#ECFDF5", icon: CurrencyRupeeOutlined },
          ].map((item) => (
            <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
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
                    width: 44, height: 44, borderRadius: "12px",
                    bgcolor: item.bg, color: item.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <item.icon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0, fontSize: "0.65rem", fontWeight: 700,
                      color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#1E293B",
                    }}
                  >
                    {fmtCurrency(item.val)}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.7rem", color: "#94A3B8" }}>
                    {item.count} payment{item.count !== 1 ? "s" : ""}
                  </p>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Monthly Revenue Trend Chart ────────────────────────────── */}
      {payments.monthlyTrend.length > 0 && (
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            p: 3,
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>
                Monthly Revenue Trend
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94A3B8", fontWeight: 500 }}>
                Collected vs expected revenue over the last 12 months.
              </p>
            </Box>
            {/* Legend */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: "#2563EB" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Collected</span>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: "#E2E8F0" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Expected</span>
              </Box>
            </Box>
          </Box>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={payments.monthlyTrend} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }}
                tickFormatter={fmtCompact}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.04)" }} />
              <Bar dataKey="expected" name="Expected" radius={[6, 6, 0, 0]} maxBarSize={32}>
                {payments.monthlyTrend.map((_, i) => (
                  <Cell key={i} fill="#E2E8F0" />
                ))}
              </Bar>
              <Bar dataKey="collected" name="Collected" radius={[6, 6, 0, 0]} maxBarSize={32}>
                {payments.monthlyTrend.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.collected === maxTrendVal ? "#1D4ED8" : "#2563EB"}
                    fillOpacity={entry.collected === maxTrendVal ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* ── Payment Status + Current Month Row ─────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Payment Status Donut */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              p: 3,
              height: "100%",
            }}
          >
            <SectionHeading color="#8B5CF6">Payment Status (All Time)</SectionHeading>
            {statusPieData.length > 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <PieChart width={280} height={220}>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [val, "Payments"]}
                    contentStyle={{
                      background: "#0F172A",
                      border: "none",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: "0.8rem",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>{v}</span>}
                  />
                </PieChart>
              </Box>
            ) : (
              <p style={{ color: "#94A3B8", textAlign: "center", fontSize: "0.85rem" }}>No payment data yet.</p>
            )}
          </Box>
        </Grid>

        {/* Current Month Stats */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              p: 3,
              height: "100%",
            }}
          >
            <SectionHeading color="#10B981">Current Month</SectionHeading>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {[
                { label: "Expected", value: fmtCurrency(payments.currentMonth.expected), color: "#3B82F6" },
                { label: "Collected", value: fmtCurrency(payments.currentMonth.collected), color: "#10B981" },
                { label: "Pending", value: fmtCurrency(payments.currentMonth.pending), color: "#EF4444" },
                { label: "Rate", value: `${payments.currentMonth.rate}%`, color: "#8B5CF6" },
              ].map((s) => (
                <Grid size={{ xs: 6 }} key={s.label}>
                  <Box
                    sx={{
                      bgcolor: "#F8FAFC",
                      borderRadius: "12px",
                      p: 2,
                      textAlign: "center",
                      border: "1px solid #F1F5F9",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94A3B8" }}>
                      {s.label}
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: "1.35rem", fontWeight: 800, color: s.color }}>
                      {s.value}
                    </p>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Monthly Expected Revenue (from active staff) */}
            <Box
              sx={{
                mt: 2.5,
                p: 2,
                bgcolor: "#EFF6FF",
                borderRadius: "12px",
                border: "1px solid #DBEAFE",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <CurrencyRupeeOutlined sx={{ fontSize: 20, color: "#2563EB" }} />
              <Box>
                <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Monthly Expected Revenue
                </p>
                <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1E40AF" }}>
                  {fmtCurrency(payments.monthlyExpectedRevenue)}
                </p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748B" }}>
                  Based on {staff.active} active staff pickup point fees
                </p>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* ── Staff Distribution ─────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* By School/College */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              p: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: "10px",
                  bgcolor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <SchoolOutlined sx={{ fontSize: 18, color: "#2563EB" }} />
              </Box>
              <Box>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#1E293B" }}>
                  By School / College
                </h3>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#94A3B8" }}>Active staff distribution</p>
              </Box>
            </Box>
            {staff.bySchool.length > 0 ? (
              staff.bySchool.map((s) => (
                <HBarItem key={s.label} label={s.label} count={s.count} max={maxSchool} color="#3B82F6" />
              ))
            ) : (
              <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>No data available.</p>
            )}
          </Box>
        </Grid>

        {/* By Pickup Point */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              p: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: "10px",
                  bgcolor: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <LocationOnOutlined sx={{ fontSize: 18, color: "#8B5CF6" }} />
              </Box>
              <Box>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#1E293B" }}>
                  By Pickup Point
                </h3>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#94A3B8" }}>Active staff by route</p>
              </Box>
            </Box>
            {staff.byPickup.length > 0 ? (
              staff.byPickup.map((p) => (
                <HBarItem key={p.label} label={`${p.label} (₹${p.fee})`} count={p.count} max={maxPickup} color="#8B5CF6" />
              ))
            ) : (
              <p style={{ color: "#94A3B8", fontSize: "0.85rem" }}>No data available.</p>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* ── By Shift ───────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          p: 3,
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: "10px",
              bgcolor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <AccessTimeOutlined sx={{ fontSize: 18, color: "#10B981" }} />
          </Box>
          <Box>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#1E293B" }}>
              By Shift
            </h3>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "#94A3B8" }}>Active staff shift distribution</p>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {staff.byShift.map((s) => (
            <Box
              key={s.label}
              sx={{
                px: 3,
                py: 2,
                bgcolor: "#F8FAFC",
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                minWidth: 120,
                textAlign: "center",
                transition: "all 0.2s",
                "&:hover": { borderColor: "#10B981", transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
              }}
            >
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#0F172A" }}>
                {s.count}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", fontWeight: 600, color: "#64748B" }}>
                {s.label} Shift
              </p>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Staff Status Summary ───────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          p: 3,
          mb: 4,
        }}
      >
        <SectionHeading color="#F59E0B">Staff Overview</SectionHeading>
        <Grid container spacing={2}>
          {[
            { label: "Total Registered", value: staff.total, color: "#0F172A" },
            { label: "Active", value: staff.active, color: "#10B981" },
            { label: "Inactive", value: staff.inactive, color: "#F59E0B" },
            { label: "Deactivated", value: staff.deactivated, color: "#EF4444" },
          ].map((s) => (
            <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  bgcolor: "#F8FAFC",
                  borderRadius: "12px",
                  border: "1px solid #F1F5F9",
                }}
              >
                <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800, color: s.color }}>
                  {s.value}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "0.72rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {s.label}
                </p>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
