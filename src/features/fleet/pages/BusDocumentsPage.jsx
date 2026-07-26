import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Typography,
  Tooltip,
  Fade,
  Autocomplete,
  Divider,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  AddRounded,
  DeleteTwoTone,
  EditTwoTone,
  DescriptionTwoTone,
  CalendarTodayTwoTone,
  CloseTwoTone,
  CheckCircleTwoTone,
  WarningAmberTwoTone,
  ErrorTwoTone,
  DirectionsBusTwoTone,
  PrintTwoTone,
  PrintDisabledTwoTone,
} from "@mui/icons-material";
import { useAuth } from "../../admin/context/AuthContext";
import {
  fetchAllBuses,
  fetchBusDocuments,
  addBusDocument,
  deleteBusDocument,
  updateBusDocument,
} from "../../../api/admin/api";

// ── Predefined document type options ────────────────────────────
const DOCUMENT_TYPE_OPTIONS = [
  "INSURANCE",
  "TAX",
  "FITNESS",
  "PERMIT",
  "PUC",
  "FAST TAG",
];

// ── Helper: compute document status ──────────────────────────────
const getDocStatus = (expiryDate) => {
  const daysLeft = Math.ceil(
    (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24),
  );
  if (daysLeft < 0)
    return {
      label: "Expired",
      color: "#991B1B",
      bg: "#FEE2E2",
      border: "#FECACA",
      Icon: ErrorTwoTone,
      iconColor: "#EF4444",
    };
  if (daysLeft <= 30)
    return {
      label: `Expires in ${daysLeft}d`,
      color: "#854D0E",
      bg: "#FEF9C3",
      border: "#FDE68A",
      Icon: WarningAmberTwoTone,
      iconColor: "#EAB308",
    };
  return {
    label: `Valid · ${daysLeft}d left`,
    color: "#166534",
    bg: "#DCFCE7",
    border: "#BBF7D0",
    Icon: CheckCircleTwoTone,
    iconColor: "#22C55E",
  };
};

export default function BusDocumentsPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [busesLoading, setBusesLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add document dialog
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    expiryDate: "",
    hasHardCopy: false,
  });

  // Edit state
  const [editingId, setEditingId] = useState(null);

  // Load all buses on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAllBuses(token);
        setBuses(res.buses || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setBusesLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  // Load documents when bus changes
  const loadDocuments = useCallback(async () => {
    if (!selectedBus) {
      setDocuments([]);
      return;
    }
    setDocsLoading(true);
    setError("");
    try {
      const res = await fetchBusDocuments(token, selectedBus._id);
      setDocuments(res.documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDocsLoading(false);
    }
  }, [token, selectedBus]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Auto-clear alerts
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ── Submit (create or update) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Document name is required.");
      return;
    }
    if (!formData.expiryDate) {
      setError("Expiry date is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        title: formData.title.trim(),
        expiryDate: formData.expiryDate,
        hasHardCopy: formData.hasHardCopy,
      };

      if (editingId) {
        await updateBusDocument(token, editingId, payload);
        setSuccess("Document updated successfully!");
      } else {
        await addBusDocument(token, {
          ...payload,
          busId: selectedBus._id,
        });
        setSuccess("Document added successfully!");
      }
      setAddOpen(false);
      setEditingId(null);
      setFormData({ title: "", expiryDate: "", hasHardCopy: false });
      loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open edit dialog with existing doc data ──
  const handleOpenEdit = (doc) => {
    setEditingId(doc._id);
    setFormData({
      title: doc.title || "",
      expiryDate: doc.expiryDate
        ? new Date(doc.expiryDate).toISOString().slice(0, 10)
        : "",
      hasHardCopy: !!doc.hasHardCopy,
    });
    setAddOpen(true);
  };

  // ── Delete document ──
  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    setError("");
    try {
      await deleteBusDocument(token, docId);
      setSuccess("Document deleted.");
      loadDocuments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseAdd = () => {
    setAddOpen(false);
    setEditingId(null);
    setFormData({ title: "", expiryDate: "", hasHardCopy: false });
  };

  // Expired / expiring-soon counts
  const expiredCount = documents.filter(
    (d) => new Date(d.expiryDate) < new Date(),
  ).length;
  const soonCount = documents.filter((d) => {
    const days = Math.ceil((new Date(d.expiryDate) - new Date()) / 86400000);
    return days >= 0 && days <= 30;
  }).length;

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── Page Header ── */}
      <Box
        sx={{
          mb: 5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                color: "white",
                display: "flex",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
              }}
            >
              <DescriptionTwoTone />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 850,
                color: "#1E293B",
                letterSpacing: "-0.02em",
              }}
            >
              Bus Documents
            </Typography>
            {documents.length > 0 && (
              <Chip
                label={documents.length}
                size="small"
                sx={{
                  bgcolor: "#F5F3FF",
                  color: "#7C3AED",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                  height: "24px",
                  px: 0.5,
                }}
              />
            )}
          </Box>
          <Typography sx={{ color: "#64748B", fontSize: "0.95rem", ml: 6 }}>
            Manage PUC, Insurance, Permits and other bus documents.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setAddOpen(true)}
          disabled={!selectedBus}
          sx={{
            background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
            color: "white",
            textTransform: "none",
            borderRadius: "12px",
            px: 3,
            py: 1.2,
            fontWeight: 700,
            fontSize: "0.95rem",
            boxShadow: "0 10px 15px -3px rgba(91, 33, 182, 0.2)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 20px 25px -5px rgba(91, 33, 182, 0.3)",
              background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
            },
            "&:disabled": {
              background: "#E2E8F0",
              color: "#94A3B8",
              boxShadow: "none",
              transform: "none",
            },
          }}
        >
          Add Document
        </Button>
      </Box>

      {/* ── Alerts ── */}
      <Fade in={!!error || !!success}>
        <Box sx={{ mb: 3 }}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError("")}
              sx={{ borderRadius: "12px" }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              onClose={() => setSuccess("")}
              sx={{ borderRadius: "12px" }}
            >
              {success}
            </Alert>
          )}
        </Box>
      </Fade>

      {/* ── Bus Selector ── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: "20px",
          border: "1px solid #F1F5F9",
          bgcolor: "#FAFBFF",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            color: "#1E293B",
            mb: 1.5,
            fontSize: "0.9rem",
          }}
        >
          Select Bus
        </Typography>
        {busesLoading ? (
          <CircularProgress size={24} sx={{ color: "#7C3AED" }} />
        ) : (
          <Autocomplete
            options={buses}
            value={selectedBus}
            onChange={(_, v) => setSelectedBus(v)}
            getOptionLabel={(b) => `${b.modelName} — ${b.numberPlate}`}
            isOptionEqualToValue={(a, b) => a._id === b._id}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by model or plate number…"
                slotProps={{
                  ...params.slotProps,
                  input: {
                    ...params.slotProps?.input,
                    startAdornment: (
                      <>
                        <DirectionsBusTwoTone
                          sx={{ fontSize: 20, color: "#94A3B8", mr: 1 }}
                        />
                        {params.slotProps?.input?.startAdornment}
                      </>
                    ),
                    sx: { borderRadius: "12px", bgcolor: "white" },
                  },
                }}
              />
            )}
            sx={{ maxWidth: 480 }}
          />
        )}

        {/* Summary badges when bus selected */}
        {selectedBus && (
          <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={`${documents.length} Total`}
              sx={{
                bgcolor: "#F5F3FF",
                color: "#7C3AED",
                fontWeight: 700,
                borderRadius: "8px",
              }}
            />
            {expiredCount > 0 && (
              <Chip
                size="small"
                label={`${expiredCount} Expired`}
                icon={<ErrorTwoTone sx={{ fontSize: "14px !important" }} />}
                sx={{
                  bgcolor: "#FEE2E2",
                  color: "#991B1B",
                  fontWeight: 700,
                  borderRadius: "8px",
                }}
              />
            )}
            {soonCount > 0 && (
              <Chip
                size="small"
                label={`${soonCount} Expiring Soon`}
                icon={
                  <WarningAmberTwoTone sx={{ fontSize: "14px !important" }} />
                }
                sx={{
                  bgcolor: "#FEF9C3",
                  color: "#854D0E",
                  fontWeight: 700,
                  borderRadius: "8px",
                }}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* ── Content Area ── */}
      {!selectedBus ? (
        <Box
          sx={{
            p: 10,
            textAlign: "center",
            bgcolor: "#F8FAFC",
            borderRadius: "32px",
            border: "2px dashed #E2E8F0",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              p: 3,
              borderRadius: "24px",
              bgcolor: "white",
              color: "#CBD5E1",
              mb: 3,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          >
            <DirectionsBusTwoTone sx={{ fontSize: 64 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#475569", mb: 1 }}
          >
            Select a Bus to View Documents
          </Typography>
          <Typography sx={{ color: "#94A3B8" }}>
            Choose a bus from the dropdown above to manage its documents.
          </Typography>
        </Box>
      ) : docsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={48} thickness={5} sx={{ color: "#7C3AED" }} />
        </Box>
      ) : documents.length === 0 ? (
        <Box
          sx={{
            p: 10,
            textAlign: "center",
            bgcolor: "#F8FAFC",
            borderRadius: "32px",
            border: "2px dashed #E2E8F0",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              p: 3,
              borderRadius: "24px",
              bgcolor: "white",
              color: "#CBD5E1",
              mb: 3,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          >
            <DescriptionTwoTone sx={{ fontSize: 64 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#475569", mb: 1 }}
          >
            No Documents Yet
          </Typography>
          <Typography sx={{ color: "#94A3B8", mb: 4 }}>
            Add the first document for <strong>{selectedBus.modelName}</strong>{" "}
            ({selectedBus.numberPlate}).
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddRounded />}
            onClick={() => setAddOpen(true)}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              color: "#7C3AED",
              borderColor: "#7C3AED",
              px: 4,
              "&:hover": { bgcolor: "#F5F3FF", borderColor: "#5B21B6" },
            }}
          >
            Add First Document
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {documents.map((doc, index) => {
            const status = getDocStatus(doc.expiryDate);
            const StatusIcon = status.Icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={doc._id}>
                <Fade in timeout={200 + index * 80}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: "20px",
                      border: `1.5px solid ${status.border}`,
                      bgcolor: "white",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                        transform: "translateY(-3px)",
                      },
                    }}
                  >
                    {/* Icon header area replacing photo */}
                    <Box
                      sx={{
                        height: 100,
                        bgcolor: status.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <DescriptionTwoTone
                        sx={{ fontSize: 52, color: status.iconColor, opacity: 0.35 }}
                      />
                      {/* Hard copy badge */}
                      <Chip
                        size="small"
                        icon={
                          doc.hasHardCopy
                            ? <PrintTwoTone sx={{ fontSize: "12px !important", color: "#166534 !important" }} />
                            : <PrintDisabledTwoTone sx={{ fontSize: "12px !important", color: "#94A3B8 !important" }} />
                        }
                        label={doc.hasHardCopy ? "Hard Copy" : "Digital Only"}
                        sx={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          bgcolor: doc.hasHardCopy ? "#DCFCE7" : "#F1F5F9",
                          color: doc.hasHardCopy ? "#166534" : "#64748B",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          borderRadius: "7px",
                          height: "22px",
                        }}
                      />
                    </Box>

                    {/* Card Content */}
                    <Box sx={{ p: 2 }}>
                      {/* Status Badge + Delete */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1.5,
                        }}
                      >
                        <Chip
                          size="small"
                          icon={
                            <StatusIcon
                              sx={{
                                fontSize: "14px !important",
                                color: `${status.iconColor} !important`,
                              }}
                            />
                          }
                          label={status.label}
                          sx={{
                            bgcolor: status.bg,
                            color: status.color,
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            borderRadius: "8px",
                            height: "24px",
                            border: `1px solid ${status.border}`,
                          }}
                        />
                        {isAdmin && (
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="Edit Document">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(doc);
                                }}
                                sx={{
                                  color: "#3B82F6",
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    bgcolor: "#EFF6FF",
                                    transform: "scale(1.1)",
                                  },
                                }}
                              >
                                <EditTwoTone fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Document">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(doc._id)}
                                sx={{
                                  color: "#EF4444",
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    bgcolor: "#FEF2F2",
                                    transform: "scale(1.1)",
                                  },
                                }}
                              >
                                <DeleteTwoTone fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>

                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "1rem",
                          color: "#0F172A",
                          mb: 0.5,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {doc.title}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <CalendarTodayTwoTone
                          sx={{ fontSize: 14, color: "#94A3B8" }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            color: "#64748B",
                            fontWeight: 600,
                          }}
                        >
                          Expires:{" "}
                          {new Date(doc.expiryDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Fade>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Add Document Dialog ── */}
      <Dialog
        open={addOpen}
        onClose={handleCloseAdd}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          },
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              p: 3,
              pb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                color: "white",
                display: "flex",
              }}
            >
              <DescriptionTwoTone sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}
              >
                {editingId ? "Edit Bus Document" : "Add Bus Document"}
              </Typography>
              <Typography
                sx={{ fontSize: "0.78rem", color: "#94A3B8", fontWeight: 500 }}
              >
                {selectedBus?.modelName} — {selectedBus?.numberPlate}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseAdd} sx={{ ml: "auto" }}>
              <CloseTwoTone />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3, pt: 2.5 }}>
            <Grid container spacing={2.5}>
              {/* Document Name — Autocomplete with suggestions */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  freeSolo
                  options={DOCUMENT_TYPE_OPTIONS}
                  value={formData.title}
                  onInputChange={(_, v) =>
                    setFormData({ ...formData, title: v })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Document Name"
                      placeholder="e.g. PUC Certificate, Insurance Policy, Permit…"
                      InputProps={{
                        ...params.InputProps,
                        sx: { borderRadius: "12px" },
                      }}
                    />
                  )}
                />
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: "#94A3B8",
                    mt: 0.5,
                    ml: 0.5,
                  }}
                >
                  Select from the list or type a custom document name.
                </Typography>
              </Grid>

              {/* Expiry Date */}
              <Grid size={{ xs: 12 }}>
                <InputLabel
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "0.85rem",
                    mb: 1,
                  }}
                >
                  Expiry Date *
                </InputLabel>
                <TextField
                  fullWidth
                  required
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <CalendarTodayTwoTone
                        sx={{ fontSize: 18, color: "#94A3B8", mr: 1 }}
                      />
                    ),
                  }}
                />
              </Grid>

              {/* Hard Copy Toggle */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: "0.88rem",
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <PrintTwoTone sx={{ fontSize: 18, color: "#7C3AED" }} />
                  Do you have a hard copy?
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={formData.hasHardCopy}
                  onChange={(_, v) => {
                    if (v !== null) setFormData({ ...formData, hasHardCopy: v });
                  }}
                  sx={{ gap: 1.5 }}
                >
                  <ToggleButton
                    value={true}
                    sx={{
                      borderRadius: "12px !important",
                      border: "1.5px solid #E2E8F0 !important",
                      px: 3,
                      py: 1,
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      textTransform: "none",
                      color: "#64748B",
                      transition: "all 0.2s",
                      "&.Mui-selected": {
                        bgcolor: "#DCFCE7 !important",
                        color: "#166534 !important",
                        border: "1.5px solid #86EFAC !important",
                      },
                    }}
                  >
                    <CheckCircleTwoTone sx={{ fontSize: 18, mr: 0.75 }} />
                    Yes
                  </ToggleButton>
                  <ToggleButton
                    value={false}
                    sx={{
                      borderRadius: "12px !important",
                      border: "1.5px solid #E2E8F0 !important",
                      px: 3,
                      py: 1,
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      textTransform: "none",
                      color: "#64748B",
                      transition: "all 0.2s",
                      "&.Mui-selected": {
                        bgcolor: "#F1F5F9 !important",
                        color: "#475569 !important",
                        border: "1.5px solid #CBD5E1 !important",
                      },
                    }}
                  >
                    <PrintDisabledTwoTone sx={{ fontSize: 18, mr: 0.75 }} />
                    No
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
            <Button
              onClick={handleCloseAdd}
              disabled={submitting}
              sx={{
                color: "#64748B",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "12px",
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "12px",
                px: 4,
                py: 1.2,
                boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                },
              }}
            >
              {submitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "white" }} />
                  <span>Saving…</span>
                </Box>
              ) : editingId ? (
                "Update Document"
              ) : (
                "Save Document"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
