import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Chip,
  CircularProgress,
  Skeleton,
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  SearchOutlined,
  FilterListOutlined,
  HistoryOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  UndoOutlined,
  EditOutlined,
  CloseOutlined,
  SaveOutlined,
  AccountBalanceOutlined,
  PaymentsOutlined,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  searchCancellation,
  fetchCancellationStats,
  processCancellation,
  fetchCancellationHistory,
  undoCancellation,
  editCancellation,
} from "../../../api/admin/api";

// ── Constants ────────────────────────────────────────────────────
const ADMIN_CHARGE = 1000;
const SESSION_MONTHS = 12;

const fmtCurrency = (n) =>
  n != null ? `₹ ${Number(n).toLocaleString("en-IN")}` : "—";

const toDateVal = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const fmtDateDisplay = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ── 15th-of-the-month Usage Logic ───────────────────────────────
const calculateUsageMonths = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) return 0;

  const totalDiff =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  if (totalDiff === 0) {
    // Same month
    if (start.getDate() <= 15 && end.getDate() >= 15) return 1.0;
    return 0.5;
  }

  let total = 0;
  // Start month contribution: before 15 = whole, after 15 = half
  total += start.getDate() <= 15 ? 1.0 : 0.5;
  // End month contribution: before 15 = half, after 15 = whole
  total += end.getDate() >= 15 ? 1.0 : 0.5;
  // Full months in between
  if (totalDiff > 1) {
    total += totalDiff - 1;
  }
  return total;
};

const computeRefund = (fee, usageMonths) => {
  const usedAmount = (fee / SESSION_MONTHS) * usageMonths;
  const refund = fee - usedAmount - ADMIN_CHARGE;
  return Math.max(0, Math.round(refund));
};

const getRefundSplit = (refundAmount, payment, refundMode = "proportional") => {
  if (!payment) return { cash: 0, bank: 0 };
  const method = payment.paymentMethod;

  if (method === "cash") return { cash: refundAmount, bank: 0 };
  if (method === "bank") return { cash: 0, bank: refundAmount };

  // 'both' — honour the chosen refundMode
  if (refundMode === "all-bank") return { cash: 0, bank: refundAmount };
  if (refundMode === "all-cash") return { cash: refundAmount, bank: 0 };

  // Default: proportional split
  const totalOrig = payment.amount || 1;
  const cashRatio = (payment.cashAmount || 0) / totalOrig;
  const cashRefund = Math.round(refundAmount * cashRatio);
  return { cash: cashRefund, bank: refundAmount - cashRefund };
};

const acctStyle = (a) =>
  ({
    A: { bg: "#EFF6FF", color: "#2563EB", label: "Account A" },
    B: { bg: "#FDF4FF", color: "#9333EA", label: "Account B" },
  })[a] || { bg: "#F1F5F9", color: "#475569", label: "Cash" };

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    bgcolor: "#F8FAFC",
    fontSize: "0.85rem",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#2563EB",
      borderWidth: "1.5px",
    },
  },
};
const labelSx = {
  margin: "0 0 4px 0",
  fontSize: "0.6rem",
  fontWeight: 700,
  color: "#94A3B8",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

export default function CancellationPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [stats, setStats] = useState({
    totalRefund: 0,
    accountARefund: 0,
    accountBRefund: 0,
    totalCount: 0,
  });
  const [rowState, setRowState] = useState({});
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- Confirmation Dialog State ---
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });

  const closeConfirm = () => setConfirmState((p) => ({ ...p, open: false }));

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchCancellationStats(token);
      if (res.success) setStats(res.data);
    } catch (e) {
      /* */
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await fetchCancellationHistory(token, 1, 100);
      if (res.success) setHistory(res.data || []);
    } catch (e) {
      /* */
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (historyOpen) loadHistory();
  }, [historyOpen, loadHistory]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await searchCancellation(token, q);
      const data = res.data || [];
      setResults(data);
      const init = {};
      data.forEach((s) => {
        const pDate = s.payment?.createdAt || s.approvedAt;
        const usage = calculateUsageMonths(pDate);
        const fee = s.payment?.amount || 0;
        const calc = computeRefund(fee, usage);
        init[s.receiptNumber] = {
          usageDate: toDateVal(pDate),
          usageMonths: usage,
          calculatedRefund: calc,
          finalSettlement: calc,
          refundMode: "proportional",
          remarks: "",
          processing: false,
        };
      });
      setRowState(init);
    } catch (err) {
      setSnack({ open: true, message: err.message, severity: "error" });
    } finally {
      setSearching(false);
    }
  };

  const handleUsageDateChange = (rn, newDate, fee) => {
    const usage = calculateUsageMonths(newDate);
    const calc = computeRefund(fee, usage);
    setRowState((p) => ({
      ...p,
      [rn]: {
        ...p[rn],
        usageDate: newDate,
        usageMonths: usage,
        calculatedRefund: calc,
        finalSettlement: calc,
      },
    }));
  };

  const handleField = (rn, field, value) => {
    setRowState((p) => ({ ...p, [rn]: { ...p[rn], [field]: value } }));
  };

  const handleProcess = async (student) => {
    const rn = student.receiptNumber;
    const row = rowState[rn];
    if (!row) return;

    const split = getRefundSplit(
      Number(row.finalSettlement),
      student.payment,
      row.refundMode,
    );
    const splitMsg =
      student.payment?.paymentMethod === "both"
        ? `Split: Cash ${fmtCurrency(split.cash)} | Bank ${fmtCurrency(split.bank)}`
        : "";

    setConfirmState({
      open: true,
      title: "Process Cancellation",
      message: `Are you sure you want to process the cancellation for ${student.fullName}? This will refund ${fmtCurrency(row.finalSettlement)} ${splitMsg ? `(${splitMsg})` : ""}.`,
      onConfirm: async () => {
        setConfirmState((p) => ({ ...p, loading: true }));
        try {
          await processCancellation(token, {
            receiptNumber: rn,
            usageStartDate: row.usageDate,
            usageMonths: row.usageMonths,
            calculatedRefund: row.calculatedRefund,
            finalSettlement: Number(row.finalSettlement),
            adminCharge: ADMIN_CHARGE,
            refundMode: row.refundMode || "proportional",
            remarks: row.remarks,
          });
          setResults((p) => p.filter((s) => s.receiptNumber !== rn));
          setSnack({
            open: true,
            message: `Refund processed for ${student.fullName}`,
            severity: "success",
          });
          loadStats();
          if (historyOpen) loadHistory();
          closeConfirm();
        } catch (err) {
          setSnack({ open: true, message: err.message, severity: "error" });
          setConfirmState((p) => ({ ...p, loading: false }));
        }
      },
      loading: false,
    });
  };

  const handleUndo = async (item) => {
    setConfirmState({
      open: true,
      title: "Undo Cancellation",
      message: `Are you sure you want to undo the cancellation for ${item.fullName}? This will restore the student (with a new ID) and move their photo back.`,
      onConfirm: async () => {
        setConfirmState((p) => ({ ...p, loading: true }));
        try {
          await undoCancellation(token, item._id);
          setSnack({
            open: true,
            message: `Cancellation undone for ${item.fullName}`,
            severity: "success",
          });
          loadStats();
          loadHistory();
          closeConfirm();
        } catch (err) {
          setSnack({ open: true, message: err.message, severity: "error" });
          setConfirmState((p) => ({ ...p, loading: false }));
        }
      },
      loading: false,
    });
  };

  const openEditDialog = (item) => {
    setEditItem(item);
    setEditForm({
      usageStartDate: toDateVal(item.usageStartDate),
      usageMonths: item.usageMonths,
      calculatedRefund: item.calculatedRefund,
      finalSettlement: item.finalSettlement,
      remarks: item.remarks || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditDateChange = (newDate) => {
    const usage = calculateUsageMonths(newDate);
    const calc = computeRefund(editItem.originalAmount, usage);
    setEditForm((p) => ({
      ...p,
      usageStartDate: newDate,
      usageMonths: usage,
      calculatedRefund: calc,
      finalSettlement: calc,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setEditSaving(true);
    try {
      await editCancellation(token, editItem._id, {
        usageStartDate: editForm.usageStartDate,
        usageMonths: editForm.usageMonths,
        calculatedRefund: editForm.calculatedRefund,
        finalSettlement: Number(editForm.finalSettlement),
        adminCharge: ADMIN_CHARGE,
        remarks: editForm.remarks,
      });
      setSnack({
        open: true,
        message: "Refund updated successfully",
        severity: "success",
      });
      setEditDialogOpen(false);
      loadStats();
      loadHistory();
    } catch (err) {
      setSnack({ open: true, message: err.message, severity: "error" });
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100 }}>
      {/* ── HEADER ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "1.55rem",
            fontWeight: 800,
            color: "#0F172A",
          }}
        >
          Cancellation & Refunds
        </h1>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <StatBlock
            label="Total Refund"
            value={stats.totalRefund}
            color="#0F172A"
          />
          <StatBlock
            label="Account A Refund"
            value={stats.accountARefund}
            color="#2563EB"
          />
          <StatBlock
            label="Account B Refund"
            value={stats.accountBRefund}
            color="#9333EA"
          />
        </Box>
      </Box>

      {/* ── SEARCH ── */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          p: 2.5,
          mb: 3,
        }}
      >
        <p style={labelSx}>Search Student</p>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            size="small"
            fullWidth
            placeholder="e.g. Rahul Sharma or B-0012"
            sx={fieldSx}
          />
          <Box
            onClick={handleSearch}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              px: 3,
              py: 1.1,
              borderRadius: "10px",
              bgcolor: "#0F172A",
              color: "#fff",
              cursor: searching ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "0.85rem",
              flexShrink: 0,
              height: 40,
              transition: "background 0.15s",
              "&:hover": { bgcolor: "#1E293B" },
              userSelect: "none",
            }}
          >
            {searching ? (
              <CircularProgress size={14} sx={{ color: "white" }} />
            ) : (
              <FilterListOutlined sx={{ fontSize: 16 }} />
            )}
            Apply
          </Box>
        </Box>
      </Box>

      {/* ── RESULTS ── */}
      {searched && (
        <Box sx={{ mb: 3 }}>
          {!searching && results.length === 0 && (
            <Box
              sx={{
                bgcolor: "#fff",
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                py: 6,
                textAlign: "center",
                color: "#94A3B8",
              }}
            >
              <SearchOutlined sx={{ fontSize: 36, opacity: 0.4, mb: 1 }} />
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>
                No active students found
              </p>
            </Box>
          )}

          {!searching &&
            results.map((student) => {
              const rn = student.receiptNumber;
              const row = rowState[rn] || {};
              const fee = student.payment?.amount || 0;
              const isBoth = student.payment?.paymentMethod === "both";
              const split = getRefundSplit(
                Number(row.finalSettlement),
                student.payment,
                row.refundMode,
              );
              const acc = acctStyle(student.payment?.settlementAccount);

              return (
                <Box
                  key={rn}
                  sx={{
                    bgcolor: "#FFFFFF",
                    borderRadius: "14px",
                    border: "1px solid #E2E8F0",
                    mb: 2,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 3,
                      py: 1.5,
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          fontFamily: "monospace",
                        }}
                      >
                        {rn}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: "0.88rem",
                        }}
                      >
                        {student.fullName}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.78rem",
                          color: "#64748B",
                        }}
                      >
                        {student.mobile}
                      </p>
                    </Box>
                    <Chip
                      label={acc.label}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        bgcolor: acc.bg,
                        color: acc.color,
                      }}
                    />
                  </Box>

                  <Box sx={{ px: 3, py: 2 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr 1fr",
                          md: "1fr 1fr 1.2fr 1fr 1.2fr",
                        },
                        gap: 2.5,
                      }}
                    >
                      <Box>
                        <p style={labelSx}>Fee Amount</p>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 800,
                            fontSize: "1.05rem",
                          }}
                        >
                          {fmtCurrency(fee)}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.65rem",
                            color: "#94A3B8",
                          }}
                        >
                          Mode: {student.payment?.paymentMethod?.toUpperCase()}
                        </p>
                      </Box>

                      <Box>
                        <p style={labelSx}>Calculated Usage</p>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 800,
                            fontSize: "1.05rem",
                          }}
                        >
                          {row.usageMonths}{" "}
                          <span
                            style={{
                              fontWeight: 500,
                              fontSize: "0.75rem",
                              color: "#64748B",
                            }}
                          >
                            mo
                          </span>
                        </p>
                        <TextField
                          type="date"
                          size="small"
                          value={row.usageDate || ""}
                          onChange={(e) =>
                            handleUsageDateChange(rn, e.target.value, fee)
                          }
                          sx={{
                            ...fieldSx,
                            mt: 1,
                            "& .MuiInputBase-input": {
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                            },
                          }}
                        />
                      </Box>

                      <Box>
                        <p style={labelSx}>Calculated Refund</p>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            color: "#16A34A",
                          }}
                        >
                          {fmtCurrency(row.calculatedRefund)}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.55rem",
                            color: "#94A3B8",
                            fontStyle: "italic",
                          }}
                        >
                          (Fee / 12) x {row.usageMonths} + 1k
                        </p>
                      </Box>

                      <Box>
                        <p style={labelSx}>Final Settlement</p>
                        <TextField
                          type="number"
                          size="small"
                          value={row.finalSettlement ?? ""}
                          onChange={(e) =>
                            handleField(rn, "finalSettlement", e.target.value)
                          }
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  ₹
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={fieldSx}
                        />
                      </Box>

                      {/* Breakdown section */}
                      <Box
                        sx={{
                          bgcolor: "#F8FAFC",
                          p: 1.5,
                          borderRadius: "10px",
                          border: "1px dashed #E2E8F0",
                        }}
                      >
                        <p style={labelSx}>Refund Breakdown</p>

                        {/* Mode toggle — only for 'both' payment method */}
                        {isBoth && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              mb: 1,
                              p: 0.4,
                              bgcolor: "#EEF2F7",
                              borderRadius: "8px",
                            }}
                          >
                            {[
                              { value: "proportional", label: "Proportional" },
                              { value: "all-bank", label: "All Bank" },
                              { value: "all-cash", label: "All Cash" },
                            ].map((opt) => (
                              <Box
                                key={opt.value}
                                onClick={() =>
                                  handleField(rn, "refundMode", opt.value)
                                }
                                sx={{
                                  flex: 1,
                                  textAlign: "center",
                                  py: 0.4,
                                  px: 0.5,
                                  borderRadius: "6px",
                                  fontSize: "0.6rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  bgcolor:
                                    (row.refundMode || "proportional") ===
                                    opt.value
                                      ? opt.value === "all-bank"
                                        ? "#2563EB"
                                        : opt.value === "all-cash"
                                          ? "#16A34A"
                                          : "#0F172A"
                                      : "transparent",
                                  color:
                                    (row.refundMode || "proportional") ===
                                    opt.value
                                      ? "#fff"
                                      : "#64748B",
                                  "&:hover": {
                                    bgcolor:
                                      (row.refundMode || "proportional") ===
                                      opt.value
                                        ? undefined
                                        : "#D1D5DB",
                                  },
                                  userSelect: "none",
                                }}
                              >
                                {opt.label}
                              </Box>
                            ))}
                          </Box>
                        )}

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <AccountBalanceOutlined
                                sx={{ fontSize: 13, color: "#64748B" }}
                              />
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#475569",
                                }}
                              >
                                Bank:
                              </span>
                            </Box>
                            <span
                              style={{ fontSize: "0.75rem", fontWeight: 700 }}
                            >
                              {fmtCurrency(split.bank)}
                            </span>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <PaymentsOutlined
                                sx={{ fontSize: 13, color: "#64748B" }}
                              />
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#475569",
                                }}
                              >
                                Cash:
                              </span>
                            </Box>
                            <span
                              style={{ fontSize: "0.75rem", fontWeight: 700 }}
                            >
                              {fmtCurrency(split.cash)}
                            </span>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 3,
                      py: 1.5,
                      borderTop: "1px solid #F8FAFC",
                      gap: 2,
                    }}
                  >
                    <TextField
                      value={row.remarks || ""}
                      onChange={(e) =>
                        handleField(rn, "remarks", e.target.value)
                      }
                      placeholder="Add details..."
                      size="small"
                      fullWidth
                      sx={fieldSx}
                    />
                    <Box
                      onClick={() => !row.processing && handleProcess(student)}
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: "10px",
                        bgcolor: row.processing ? "#94A3B8" : "#2563EB",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        minWidth: 100,
                        textAlign: "center",
                      }}
                    >
                      {row.processing ? (
                        <CircularProgress size={16} sx={{ color: "white" }} />
                      ) : (
                        "PROCESS"
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
        </Box>
      )}

      {/* ── POLICY SUMMARY ── */}
      <Box
        sx={{
          bgcolor: "#FFFBEB",
          borderRadius: "14px",
          border: "1px solid #FEF3C7",
          p: 3,
          mb: 3,
        }}
      >
        <p
          style={{
            margin: "0 0 8px 0",
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "#92400E",
            textTransform: "uppercase",
          }}
        >
          Calculation Rules
        </p>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400E" }}>
              <strong>Start Date:</strong>
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#92400E" }}>
              &bull; On/Before 15th: Full Month (1.0)
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#92400E" }}>
              &bull; After 15th: Half Month (0.5)
            </p>
          </Box>
          <Box>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400E" }}>
              <strong>End Date:</strong>
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#92400E" }}>
              &bull; Before 15th: Half Month (0.5)
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#92400E" }}>
              &bull; On/After 15th: Full Month (1.0)
            </p>
          </Box>
        </Box>
      </Box>

      {/* ── HISTORY ── */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        <Box
          onClick={() => setHistoryOpen((p) => !p)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            cursor: "pointer",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <HistoryOutlined sx={{ color: "#64748B" }} />
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700 }}>
              Processed Refunds
            </p>
          </Box>
          {historyOpen ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
        </Box>

        {historyOpen && (
          <Box sx={{ px: 2, pb: 2 }}>
            {historyLoading ? (
              <Skeleton height={100} />
            ) : (
              history.map((c) => (
                <Box
                  key={c._id}
                  sx={{
                    bgcolor: "#FAFBFC",
                    borderRadius: "12px",
                    border: "1px solid #F1F5F9",
                    mb: 1,
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    >
                      {c.fullName} ({c.receiptNumber})
                    </p>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(c)}
                        sx={{ bgcolor: "#FFF7ED", color: "#EA580C" }}
                      >
                        <EditOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleUndo(c)}
                        sx={{ bgcolor: "#EFF6FF", color: "#2563EB" }}
                      >
                        <UndoOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      label={`Refund: ${fmtCurrency(c.finalSettlement)}`}
                      size="small"
                      sx={{
                        bgcolor: "#FEF2F2",
                        color: "#DC2626",
                        fontWeight: 700,
                      }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      Mode: {c.paymentMethod?.toUpperCase()}
                    </span>
                    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                      {c.refundAccountA > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#2563EB",
                            }}
                          />
                          <span
                            style={{ fontSize: "0.75rem", color: "#475569" }}
                          >
                            Account A:{" "}
                            <strong>{fmtCurrency(c.refundAccountA)}</strong>
                          </span>
                        </Box>
                      )}
                      {c.refundAccountB > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#9333EA",
                            }}
                          />
                          <span
                            style={{ fontSize: "0.75rem", color: "#475569" }}
                          >
                            Account B:{" "}
                            <strong>{fmtCurrency(c.refundAccountB)}</strong>
                          </span>
                        </Box>
                      )}
                      {c.refundCash > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#16A34A",
                            }}
                          />
                          <span
                            style={{ fontSize: "0.75rem", color: "#475569" }}
                          >
                            Cash: <strong>{fmtCurrency(c.refundCash)}</strong>
                          </span>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>

      {/* ── EDIT DIALOG ── */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px" } } }}
      >
        <Box sx={{ p: 3 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem" }}>
            Edit Refund
          </p>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              mt: 3,
            }}
          >
            <Box>
              <p style={labelSx}>Usage Start Date</p>
              <TextField
                type="date"
                size="small"
                fullWidth
                value={editForm.usageStartDate || ""}
                onChange={(e) => handleEditDateChange(e.target.value)}
                sx={fieldSx}
              />
            </Box>
            <Box>
              <p style={labelSx}>Usage Months</p>
              <p style={{ fontWeight: 700 }}>{editForm.usageMonths}</p>
            </Box>
            <Box sx={{ gridColumn: "1/3" }}>
              <p style={labelSx}>Final Settlement</p>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={editForm.finalSettlement ?? ""}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    finalSettlement: e.target.value,
                  }))
                }
                sx={fieldSx}
              />
            </Box>
          </Box>
          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
          >
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              disabled={editSaving}
            >
              {editSaving ? "Saving..." : "Save"}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* ── CONFIRMATION DIALOG ── */}
      <Dialog
        open={confirmState.open}
        onClose={confirmState.loading ? null : closeConfirm}
        slotProps={{ paper: { sx: { borderRadius: "16px", p: 1 } } }}
      >
        <DialogContent>
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: "1.1rem",
              color: "#0F172A",
            }}
          >
            {confirmState.title}
          </p>
          <p
            style={{
              marginTop: 8,
              fontSize: "0.9rem",
              color: "#64748B",
              lineHeight: 1.5,
            }}
          >
            {confirmState.message}
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={closeConfirm}
            disabled={confirmState.loading}
            sx={{ borderRadius: "10px", fontWeight: 700, color: "#64748B" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmState.onConfirm}
            disabled={confirmState.loading}
            sx={{
              borderRadius: "10px",
              fontWeight: 700,
              bgcolor: confirmState.title.includes("Undo")
                ? "#2563EB"
                : "#0F172A",
              px: 3,
            }}
          >
            {confirmState.loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function StatBlock({ label, value, color }) {
  return (
    <Box sx={{ textAlign: "right" }}>
      <p
        style={{
          margin: 0,
          fontSize: "0.6rem",
          fontWeight: 700,
          color: "#64748B",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color }}>
        {fmtCurrency(value)}
      </p>
    </Box>
  );
}
