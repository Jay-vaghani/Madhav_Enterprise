import React, { useState, useRef, useCallback } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  CheckCircle,
  EditOutlined,
  ExpandMore,
  CenterFocusWeak,
  Gavel,
  Shield,
} from "@mui/icons-material";
import imageCompression from "browser-image-compression";
import { useRegistration, YEARS } from "../context/RegistrationContext";
import ImageCropModal from "../../../components/ImageCropModal";

async function compressToWebpUnder50KB(base64Input, maxKB = 50) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 600;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.85;
      const tryEncode = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob failed"));
              return;
            }
            if (blob.size <= maxKB * 1024 || quality <= 0.05) {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            } else {
              quality = Math.max(0.05, quality - 0.1);
              tryEncode();
            }
          },
          "image/webp",
          quality,
        );
      };
      tryEncode();
    };
    img.onerror = reject;
    img.src = base64Input;
  });
}

// ── T&C content ────────────────────────────────────────────────
const TERMS = [
  {
    bold: false,
    text: "Institution has made transport arrangement for TO & FRO passage of Students from various Pick-Up Points of Vadodara City to KPGU, Krishna Edu Campus, Varnama. Students who desire to avail the transport facility is requested to submit his/her application form to Transport Office of the Institution.",
  },
  {
    bold: true,
    text: "Transport facility will be provided for FULL ACADEMIC YEAR only and not for the part of the year.",
  },
  {
    bold: true,
    text: "Transport Fees will be refunded only in case of cancellation of admission.",
  },
  {
    bold: true,
    text: "Please note that students must keep Bus Pass while traveling in Bus. Penalty will be charged in case student member found without Bus Pass.",
  },
  {
    bold: true,
    text: "Management reserves the right to alter or amend route (Circular Route) of Buses as per the requirements of the Institution.",
  },
];

// ── Typography tokens ──────────────────────────────────────────
const lbl = {
  margin: "0 0 2px 0",
  fontSize: "0.64rem",
  fontWeight: 700,
  color: "#94A3B8",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};
const val = {
  margin: 0,
  fontSize: "0.88rem",
  fontWeight: 700,
  color: "#1E3A8A",
  lineHeight: 1.35,
};
const empty = {
  margin: 0,
  fontSize: "0.85rem",
  fontStyle: "italic",
  color: "#CBD5E1",
  fontWeight: 400,
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    bgcolor: "white",
    fontSize: "0.88rem",
  },
};
const smSx = {
  ...inputSx,
  "& .MuiOutlinedInput-root": {
    ...inputSx["& .MuiOutlinedInput-root"],
    height: 40,
  },
};

// ── Reusable inline-edit text field ───────────────────────────
function EditText({
  fieldKey,
  label,
  multiline = false,
  type = "text",
  maxLength,
}) {
  const { formData, updateFormData } = useRegistration();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(formData[fieldKey] || "");

  const open = () => {
    setDraft(formData[fieldKey] || "");
    setEditing(true);
  };
  const save = () => {
    updateFormData({ [fieldKey]: draft.trim() });
    setEditing(false);
  };
  const onKey = (e) => {
    if (e.key === "Enter" && !multiline) save();
    if (e.key === "Escape") setEditing(false);
  };
  const cur = formData[fieldKey];

  if (editing)
    return (
      <Box sx={{ mb: 1.5 }}>
        <p style={lbl}>{label}</p>
        <TextField
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={onKey}
          autoFocus
          multiline={multiline}
          rows={multiline ? 3 : 1}
          fullWidth
          size="small"
          type={type}
          inputProps={{ maxLength }}
          sx={inputSx}
        />
      </Box>
    );

  return (
    <Box sx={{ mb: 1.5 }}>
      <p style={lbl}>{label}</p>
      <Box
        onClick={open}
        sx={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          "&:hover .ei": { opacity: 1 },
        }}
      >
        <p style={cur ? val : empty}>{cur || "Tap to add"}</p>
        <EditOutlined
          className="ei"
          sx={{
            fontSize: 12,
            color: "#2563EB",
            opacity: 0.35,
            transition: "opacity 0.15s",
            flexShrink: 0,
          }}
        />
      </Box>
    </Box>
  );
}

// ── Inline Autocomplete (Department / Pickup Point) ────────────
function EditAutocomplete({ fieldKey, label, options }) {
  const { formData, updateFormData } = useRegistration();
  const [editing, setEditing] = useState(false);
  const cur = formData[fieldKey];

  if (editing)
    return (
      <Box sx={{ mb: 1.5 }}>
        <p style={lbl}>{label}</p>
        <Autocomplete
          options={options}
          value={formData[fieldKey]}
          getOptionLabel={(o) => o?.label ?? ""}
          isOptionEqualToValue={(o, v) => o?.id === v?.id}
          onChange={(_, selected) => {
            updateFormData({ [fieldKey]: selected });
            setEditing(false);
          }}
          onBlur={() => setEditing(false)}
          open
          autoFocus
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus
              size="small"
              placeholder={`Search ${label}...`}
              sx={inputSx}
            />
          )}
        />
      </Box>
    );

  return (
    <Box sx={{ mb: 1.5 }}>
      <p style={lbl}>{label}</p>
      <Box
        onClick={() => setEditing(true)}
        sx={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          "&:hover .ei": { opacity: 1 },
        }}
      >
        <p style={cur ? val : empty}>{cur?.label || "Tap to add"}</p>
        <EditOutlined
          className="ei"
          sx={{
            fontSize: 12,
            color: "#2563EB",
            opacity: 0.35,
            transition: "opacity 0.15s",
            flexShrink: 0,
          }}
        />
      </Box>
    </Box>
  );
}

// ── Inline Autocomplete Wrapper (uses dynamic data from context) ────────────
function EditAutocompleteWrapper({ fieldKey, label, type }) {
  const { departments, pickupPoints } = useRegistration();
  
  const options = type === "departments" ? departments : pickupPoints;
  
  return (
    <EditAutocomplete 
      fieldKey={fieldKey} 
      label={label} 
      options={options} 
    />
  );
}

// ── Inline Year Select ─────────────────────────────────────────
function EditYear() {
  const { formData, updateFormData } = useRegistration();
  const [editing, setEditing] = useState(false);
  const cur = formData.year;

  if (editing)
    return (
      <Box sx={{ mb: 1.5 }}>
        <p style={lbl}>Year of Study</p>
        <FormControl fullWidth size="small">
          <Select
            value={formData.year || ""}
            autoFocus
            open
            onChange={(e) => {
              updateFormData({
                year: e.target.value,
                semester:
                  YEARS.find((y) => y.value === e.target.value)?.autoSemester ||
                  "",
              });
              setEditing(false);
            }}
            onClose={() => setEditing(false)}
            sx={{ borderRadius: "8px", bgcolor: "white", fontSize: "0.88rem" }}
          >
            {YEARS.map((y) => (
              <MenuItem key={y.value} value={y.value}>
                {y.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );

  const label = YEARS.find((y) => y.value === cur)?.label;
  const sem = formData.semester || null;
  const display = label ? `${label}${sem ? ` / ${sem}` : ""}` : null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <p style={lbl}>Year / Semester</p>
      <Box
        onClick={() => setEditing(true)}
        sx={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          "&:hover .ei": { opacity: 1 },
        }}
      >
        <p style={display ? val : empty}>{display || "Tap to add"}</p>
        <EditOutlined
          className="ei"
          sx={{
            fontSize: 12,
            color: "#2563EB",
            opacity: 0.35,
            transition: "opacity 0.15s",
            flexShrink: 0,
          }}
        />
      </Box>
    </Box>
  );
}

// ── Inline Shift Select ────────────────────────────────────────
function EditShift() {
  const { formData, updateFormData, shifts } = useRegistration();
  const [editing, setEditing] = useState(false);
  const cur = shifts.find((s) => s.id === formData.shift);

  if (editing)
    return (
      <Box sx={{ mb: 1.5 }}>
        <p style={lbl}>Academic Shift</p>
        <FormControl fullWidth size="small">
          <Select
            value={formData.shift || ""}
            autoFocus
            open
            onChange={(e) => {
              updateFormData({ shift: e.target.value });
              setEditing(false);
            }}
            onClose={() => setEditing(false)}
            sx={{ borderRadius: "8px", bgcolor: "white", fontSize: "0.88rem" }}
          >
            {shifts.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.emoji} {s.label} — {s.time}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );

  return (
    <Box sx={{ mb: 1.5 }}>
      <p style={lbl}>Academic Shift</p>
      <Box
        onClick={() => setEditing(true)}
        sx={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          "&:hover .ei": { opacity: 1 },
        }}
      >
        <p style={cur ? val : empty}>
          {cur ? `${cur.emoji} ${cur.label} (${cur.time})` : "Tap to add"}
        </p>
        <EditOutlined
          className="ei"
          sx={{
            fontSize: 12,
            color: "#2563EB",
            opacity: 0.35,
            transition: "opacity 0.15s",
            flexShrink: 0,
          }}
        />
      </Box>
    </Box>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 1.25,
        pb: 0.75,
        borderBottom: "1px solid #E0E7FF",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "0.63rem",
          fontWeight: 800,
          color: "#6366F1",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </p>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function FinalReviewStep() {
  const { formData, updateFormData } = useRegistration();
  const [photo, setPhoto] = useState(() => {
    if (formData.photoBase64) {
      return {
        url: formData.photoBase64,
        name: "uploaded_photo.webp",
        finalSize: (formData.photoBase64.length * 0.75 / 1024 / 1024).toFixed(2),
        wasCompressed: true,
      };
    }
    return null;
  });
  const [compressing, setCompressing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(
    formData.termsAccepted ?? false,
  );
  const fileInputRef = useRef(null);

  // ── Image crop state ────────────────────────────────────────
  const [cropSrc, setCropSrc] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [rawFile, setRawFile] = useState(null);

  // ── Step 1: Select file → open crop modal ──────────────────
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null;
    setRawFile(file);
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);
  }, []);

  // ── Step 2: After crop → compress if needed → save ─────────
  const handleCropComplete = useCallback(
    async (croppedBase64) => {
      setCropOpen(false);
      setCropSrc(null);
      setCompressing(true);

      try {
        const finalBase64 = await compressToWebpUnder50KB(croppedBase64, 50);
        
        // Calculate approx size
        const finalSizeMB = (finalBase64.length * 0.75 / 1024 / 1024).toFixed(3);

        setPhoto({
          url: finalBase64,
          name: rawFile?.name || "photo.webp",
          originalSize: (rawFile?.size ? (rawFile.size / 1048576).toFixed(1) : "0.0"),
          finalSize: finalSizeMB,
          wasCompressed: true,
          base64: finalBase64,
        });
        
        updateFormData({ photoBase64: finalBase64 });
      } catch (err) {
        console.error("Compression failed:", err);
      } finally {
        setCompressing(false);
      }
    },
    [rawFile, updateFormData],
  );

  const handleTermsToggle = (e) => {
    setTermsAccepted(e.target.checked);
    updateFormData({ termsAccepted: e.target.checked });
  };

  const pickup = formData.pickupPoint;

  return (
    <Box>
      <Grid container spacing={{ xs: 3, lg: 5 }}>
        {/* ══ LEFT ═══════════════════════════════════════════════ */}
        <Grid size={{ xs: 12, lg: 7 }}>
          {/* Headline */}
          <Box sx={{ mb: 4 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.8rem,4vw,2.5rem)",
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: 1.2,
              }}
            >
              Verification &amp;
            </h1>
            <h1
              style={{
                margin: "0 0 12px 0",
                fontSize: "clamp(1.8rem,4vw,2.5rem)",
                fontWeight: 800,
                color: "#2563EB",
                lineHeight: 1.2,
              }}
            >
              Submission.
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "1rem",
                color: "#64748B",
                maxWidth: 520,
                lineHeight: 1.6,
              }}
            >
              Upload your photo and review your information before final
              submission. This ensures the integrity of your registration
              profile.
            </p>
          </Box>

          {/* Identity Photograph */}
          <Box sx={{ mb: 3 }}>
            <p
              style={{
                margin: "0 0 10px 0",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Identity Photograph
            </p>
            <Box
              onClick={() => !compressing && fileInputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: photo ? "#10B981" : "#CBD5E1",
                borderRadius: "16px",
                p: 2,
                cursor: compressing ? "wait" : "pointer",
                bgcolor: photo ? "#F0FDF4" : "#F8FAFC",
                transition: "all 0.25s",
                "&:hover": !compressing
                  ? { borderColor: "#2563EB", bgcolor: "#EFF6FF" }
                  : {},
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />

              {compressing ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 4,
                    gap: 1.5,
                  }}
                >
                  <CircularProgress size={36} sx={{ color: "#2563EB" }} />
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: "#2563EB",
                    }}
                  >
                    Compressing image…
                  </p>
                  <p
                    style={{ margin: 0, fontSize: "0.78rem", color: "#94A3B8" }}
                  >
                    Keeping quality as high as possible (target ≤ 5 MB)
                  </p>
                </Box>
              ) : photo ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    bgcolor: "white",
                    borderRadius: "12px",
                    p: 2,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  }}
                >
                  <Box sx={{ position: "relative", flexShrink: 0 }}>
                    <Box
                      component="img"
                      src={photo.url}
                      alt="ID"
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3px solid #E2E8F0",
                      }}
                    />
                    <CheckCircle
                      sx={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        fontSize: 20,
                        color: "#10B981",
                        bgcolor: "white",
                        borderRadius: "50%",
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "#0F172A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {photo.name}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 4px 0",
                        fontSize: "0.8rem",
                        color: "#64748B",
                      }}
                    >
                      {photo.wasCompressed
                        ? `Compressed ${photo.originalSize} MB → ${photo.finalSize} MB • Ready`
                        : `${photo.finalSize} MB • Ready`}
                    </p>
                    {photo.wasCompressed && (
                      <Chip
                        label="Auto-compressed"
                        size="small"
                        sx={{
                          bgcolor: "#D1FAE5",
                          color: "#065F46",
                          fontWeight: 700,
                          fontSize: "0.62rem",
                          height: 20,
                          mb: 0.5,
                        }}
                      />
                    )}
                    <Box
                      onClick={() => !compressing && fileInputRef.current?.click()}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        width: "fit-content",
                        mt: 0.5,
                        cursor: compressing ? "wait" : "pointer",
                      }}
                    >
                      <CenterFocusWeak
                        sx={{ fontSize: 14, color: "#2563EB" }}
                      />
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "#2563EB",
                        }}
                      >
                        Replace image
                      </p>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 4,
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: "14px",
                      bgcolor: "#EFF6FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1,
                    }}
                  >
                    <CenterFocusWeak sx={{ fontSize: 24, color: "#2563EB" }} />
                  </Box>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#0F172A",
                    }}
                  >
                    Click to upload photo
                  </p>
                  <p
                    style={{ margin: 0, fontSize: "0.8rem", color: "#94A3B8" }}
                  >
                    JPG, PNG — files over 5 MB are auto-compressed
                  </p>
                </Box>
              )}
            </Box>
          </Box>

          {/* Terms & Conditions */}
          <Accordion
            defaultExpanded={true}
            elevation={0}
            sx={{
              border: "1px solid #E2E8F0",
              borderRadius: "12px !important",
              mb: 2,
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: "#64748B" }} />}
              sx={{ px: 2.5, py: 0.5 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Gavel sx={{ fontSize: 18, color: "#2563EB" }} />
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: "#0F172A",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Terms &amp; Conditions
                </p>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 2.5, pt: 0 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {TERMS.map((t, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1.5 }}>
                    <p
                      style={{
                        margin: 0,
                        color: "#2563EB",
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        flexShrink: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      »
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        color: "#334155",
                        lineHeight: 1.65,
                        fontWeight: t.bold ? 700 : 400,
                      }}
                    >
                      {t.text}
                    </p>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Terms toggle */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              px: 2.5,
              py: 1.25,
              transition: "all 0.2s",
              ...(termsAccepted && {
                borderColor: "#2563EB",
                bgcolor: "#EFF6FF",
              }),
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "#0F172A",
                fontWeight: 500,
              }}
            >
              I accept the terms and conditions
            </p>
            <Switch
              checked={termsAccepted}
              onChange={handleTermsToggle}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#2563EB" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: "#2563EB",
                },
              }}
            />
          </Box>
        </Grid>

        {/* ══ RIGHT ══════════════════════════════════════════════ */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: "20px",
              bgcolor: "#EEF2FF",
              border: "1px solid #C7D2FE",
              mb: 3,
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, lg: 3 } }}>
              {/* Card header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  mb: 2.5,
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#1E3A8A",
                  }}
                >
                  Review Summary
                </p>
                <Chip
                  label="PENDING SUBMISSION"
                  size="small"
                  sx={{
                    bgcolor: "#FEF3C7",
                    color: "#92400E",
                    fontWeight: 700,
                    fontSize: "0.56rem",
                    letterSpacing: "0.04em",
                    border: "1px solid #FDE68A",
                    height: 22,
                  }}
                />
              </Box>

              {/* ── Personal Details ── */}
              <SectionHeader label="Personal Details" />
              <EditText fieldKey="fullName" label="Full Name (Aadhaar)" />
              <EditText fieldKey="email" label="Email" type="email" />
              <EditText fieldKey="mobile" label="Student Mobile" />
              <EditText fieldKey="guardianMobile" label="Guardian Mobile" />
              <EditText fieldKey="pinCode" label="PIN Code" maxLength={6} />
              <EditText fieldKey="permanentAddress" label="Address" multiline />

              {/* ── Academic Identity ── */}
              <Box sx={{ mt: 1.5 }}>
                <SectionHeader label="Academic Identity" />
                <EditText fieldKey="enrollmentNumber" label="Enrollment No." />
                <EditAutocompleteWrapper fieldKey="department" label="Department" type="departments" />
                <EditYear />
                <EditShift />
              </Box>

              {/* ── Transport ── */}
              <Box sx={{ mt: 1.5 }}>
                <SectionHeader label="Transport" />
                <EditAutocompleteWrapper fieldKey="pickupPoint" label="Pickup Point" type="pickupPoints" />
                {pickup && (
                  <Box sx={{ mb: 1.5 }}>
                    <p style={lbl}>Annual Fee</p>
                    <p style={val}>₹ {pickup.fee?.toLocaleString("en-IN")}</p>
                  </Box>
                )}
              </Box>

              {/* Registration Progress */}
              <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #C7D2FE" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.25,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Registration Progress
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: "#1E3A8A",
                    }}
                  >
                    100%
                  </p>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 8,
                    borderRadius: 99,
                    bgcolor: "#C7D2FE",
                    "& .MuiLinearProgress-bar": {
                      background: "linear-gradient(90deg,#2563EB,#1D4ED8)",
                      borderRadius: 99,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Secured Information */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
              bgcolor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: "16px",
              p: 2.5,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                bgcolor: "#DBEAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Shield sx={{ color: "#2563EB", fontSize: 22 }} />
            </Box>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#1E3A8A",
                }}
              >
                Secured Information
              </p>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "0.82rem",
                  color: "#3B82F6",
                  lineHeight: 1.5,
                }}
              >
                Your data is not shared with any third party and only used for
                transport purpose.
              </p>
            </div>
          </Box>
        </Grid>
      </Grid>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropOpen}
        imageSrc={cropSrc}
        onClose={() => {
          setCropOpen(false);
          setCropSrc(null);
        }}
        onComplete={handleCropComplete}
      />
    </Box>
  );
}
