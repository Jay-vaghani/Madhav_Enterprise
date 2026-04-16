import React, { useRef, useCallback } from "react";
import { Dialog, DialogContent, Button, Box, IconButton } from "@mui/material";
import { CloseOutlined, PrintOutlined } from "@mui/icons-material";

// Year labels
const YEAR_MAP = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
const SHIFT_MAP = {
  "7:30": "1st (7:30 AM)",
  "9:30": "2nd (9:30 AM)",
  "10:30": "3rd (10:30 AM)",
};

// Format date helper
const fmtDate = (d) => {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

const fmtDateTime = (d) => {
  const dt = new Date(d);
  const date = `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
  const hours = dt.getHours();
  const mins = String(dt.getMinutes()).padStart(2, "0");
  const secs = String(dt.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const h12 = hours % 12 || 12;
  return `${date}, ${h12}:${mins}:${secs} ${ampm}`;
};

const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}/-`;

// Build payment mode string
const getPaymentModeDisplay = (data) => {
  if (!data) return "—";
  const { paymentMode, transaction1, transaction2 } = data;

  if (paymentMode === "cash") {
    return "OFFLINE PAYMENT";
  }

  const txns = [transaction1, transaction2].filter(Boolean).join(" | ");

  if (paymentMode === "bank") {
    return `ONLINE ${txns}`;
  }

  if (paymentMode === "both") {
    return `ONLINE ${txns} + CASH`;
  }

  return "—";
};

export default function ReceiptDialog({ open, receiptData, onClose }) {
  const receiptRef = useRef(null);

  const handlePrint = useCallback(() => {
    if (!receiptData) return;

    const data = receiptData;
    const yearLabel = YEAR_MAP[data.year] || data.year;
    const shiftLabel = SHIFT_MAP[data.shift] || data.shift;
    const deptLabel = data.department?.label || data.department || "—";
    const pickupLabel = data.pickupPoint?.label || data.pickupPoint || "—";
    const paymentDisplay = getPaymentModeDisplay(data);

    const printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Receipt ${data.receiptNumber}</title>
<style>
  @page {
    size: A4;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .receipt-page {
    width: 210mm;
    height: 99mm;
    padding: 6mm 8mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    border-bottom: 2px dashed #999;
  }

  /* Background watermark */
  .receipt-page::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90mm;
    height: 90mm;
    background-image: url('https://madhav-enterprise.vercel.app/images/logo1.svg');
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.2;
    z-index: 0;
  }

  .receipt-inner {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2.5px solid #1a1a1a;
    padding-bottom: 3mm;
    margin-bottom: 2mm;
  }
  .header-left { flex: 1; }
  .header-meta {
    font-size: 7.5pt;
    color: #444;
    margin-bottom: 1mm;
  }
  .company-name {
    font-size: 16pt;
    font-weight: 900;
    color: #0F172A;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .company-contact {
    font-size: 7.5pt;
    color: #555;
    margin-top: 0.5mm;
  }
  .header-right {
    text-align: right;
  }
  .receipt-badge {
    display: inline-block;
    background: #1E3A8A;
    color: white;
    font-size: 9pt;
    font-weight: 800;
    padding: 1.5mm 4mm;
    border-radius: 2mm;
    letter-spacing: 1px;
    margin-bottom: 1.5mm;
  }
  .sr-no {
    font-size: 11pt;
    font-weight: 800;
    color: #DC2626;
    letter-spacing: 0.5px;
  }

  /* Shift bar */
  .shift-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #F1F5F9;
    opacity: 0.7;
    border: 1px solid #E2E8F0;
    border-radius: 1.5mm;
    padding: 1.5mm 3mm;
    margin-bottom: 2mm;
    font-size: 8pt;
  }
  .shift-label {
    font-weight: 800;
    color: #0F172A;
  }

  /* Acknowledgement */
  .ack-text {
    font-size: 7.5pt;
    color: #475569;
    font-style: italic;
    text-align: center;
    margin-bottom: 2mm;
    padding: 1mm 0;
    border-top: 0.5px solid #E2E8F0;
    border-bottom: 0.5px solid #E2E8F0;
  }

  /* Content area */
  .content {
    display: flex;
    gap: 3mm;
    flex: 1;
  }
  .details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.2mm;
  }
  .photo-col {
    width: 25mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5mm;
  }
  .photo-frame {
    width: 24mm;
    height: 28mm;
    border: 1.5px solid #CBD5E1;
    border-radius: 1.5mm;
    overflow: hidden;
    background: #F8FAFC;
    position: relative;
  }
  .photo-frame::before {
    content: '';
    position: absolute;
    top: -1px; left: -7px; right: 0px; bottom: -1px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3Cpattern id='g' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 10h20M10 0v20' stroke='%230F172A' stroke-width='0.3' opacity='0.35'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23g)'/%3E%3Ccircle cx='100' cy='100' r='70' fill='none' stroke='%230F172A' stroke-width='1' opacity='0.3'/%3E%3Ccircle cx='100' cy='100' r='55' fill='none' stroke='%230F172A' stroke-width='0.5' opacity='0.25'/%3E%3Ccircle cx='100' cy='100' r='40' fill='none' stroke='%230F172A' stroke-width='0.8' opacity='0.3'/%3E%3Cpath d='M100 30L115 70H85Z' fill='none' stroke='%230F172A' stroke-width='0.6' opacity='0.25'/%3E%3Cpath d='M100 170L85 130H115Z' fill='none' stroke='%230F172A' stroke-width='0.6' opacity='0.25'/%3E%3Cpath d='M30 100L70 85V115Z' fill='none' stroke='%230F172A' stroke-width='0.6' opacity='0.25'/%3E%3Cpath d='M170 100L130 115V85Z' fill='none' stroke='%230F172A' stroke-width='0.6' opacity='0.25'/%3E%3Ctext x='100' y='105' text-anchor='middle' font-size='18' font-weight='900' fill='%230F172A' opacity='0.18' font-family='sans-serif'%3EME%3C/text%3E%3C/svg%3E");
    background-size: cover;
    opacity: 0.4;
    z-index: 1;
  }
  .photo-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.7;
    position: relative;
    z-index: 0;
  }

  /* Detail rows */
  .row {
    display: flex;
    align-items: baseline;
    font-size: 8pt;
    line-height: 1.4;
  }
  .row-label {
    font-weight: 700;
    color: #334155;
    white-space: nowrap;
    min-width: 26mm;
  }
  .row-sep {
    margin: 0 1mm;
    color: #94A3B8;
  }
  .row-value {
    flex: 1;
    font-weight: 600;
    color: #0F172A;
    border-bottom: 0.5px dotted #CBD5E1;
    padding-bottom: 0.3mm;
  }
  .row-double {
    display: flex;
    gap: 3mm;
  }
  .row-double .row {
    flex: 1;
  }

  /* Footer */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: auto;
    padding-top: 2mm;
    border-top: 1px solid #E2E8F0;
  }
  .validity-badge {
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 1.5mm;
    padding: 1mm 3mm;
    font-size: 8pt;
    font-weight: 700;
    color: #DC2626;
  }
  .validity-badge span {
    color: #0F172A;
    font-weight: 800;
  }
  .signature {
    text-align: right;
  }
  .sig-company {
    font-size: 8pt;
    font-weight: 800;
    color: #0F172A;
    margin-bottom: 13mm;
  }
  .sig-line {
    width: 35mm;
    border-top: 1px solid #334155;
    margin-left: auto;
  }
  .sig-text {
    font-size: 7pt;
    color: #64748B;
    font-style: italic;
    margin-top: 0.5mm;
    text-align: right;
  }

  @media print {
    body { margin: 0; }
    .receipt-page {
      border-bottom: 2px dashed #999;
    }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<div class="receipt-page">
  <div class="receipt-inner">

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="header-meta">Date : ${fmtDateTime(data.approvedAt)}</div>
        <div class="company-name">MADHAV ENTERPRISE</div>
        <div class="company-contact">Mobile No.: 8347125664</div>
      </div>
      <div class="header-right">
        <div class="receipt-badge">RECEIPT</div>
        <div class="sr-no">Sr. No. ${data.receiptNumber}</div>
      </div>
    </div>

    <!-- Shift Bar -->
    <div class="shift-bar">
      <div>Shift: <span class="shift-label">${shiftLabel}</span></div>
      <div style="font-size:7pt;color:#64748B;">Academic Year 2025-2026</div>
    </div>

    <!-- Acknowledgement -->
    <div class="ack-text">
      Received with thanks towards the Transportation Fees for the Academic Year. ${new Date().getFullYear()}-${new Date().getFullYear() + 1}
    </div>

    <!-- Content -->
    <div class="content">
      <div class="details">
        <div class="row">
          <span class="row-label">Name of the Student</span>
          <span class="row-sep">:</span>
          <span class="row-value">${data.fullName}</span>
        </div>

        <div class="row-double">
          <div class="row">
            <span class="row-label">YEAR</span>
            <span class="row-sep">:</span>
            <span class="row-value">${yearLabel}</span>
          </div>
          <div class="row">
            <span class="row-label">SEMESTER</span>
            <span class="row-sep">:</span>
            <span class="row-value">${data.semester || "—"}</span>
          </div>
        </div>

        <div class="row">
          <span class="row-label">BRANCH</span>
          <span class="row-sep">:</span>
          <span class="row-value">${deptLabel}</span>
        </div>

        <div class="row-double">
          <div class="row">
            <span class="row-label">Enroll/ID No.</span>
            <span class="row-sep">:</span>
            <span class="row-value">${data.enrollmentNumber || "No ID"}</span>
          </div>
          <div class="row">
            <span class="row-label">Academic year</span>
            <span class="row-sep">:</span>
            <span class="row-value">2025-2026</span>
          </div>
        </div>

        <div class="row-double">
          <div class="row">
            <span class="row-label">PICK-UP POINT</span>
            <span class="row-sep">:</span>
            <span class="row-value">${pickupLabel}</span>
          </div>
          <div class="row">
            <span class="row-label">Amount(₹)</span>
            <span class="row-sep">:</span>
            <span class="row-value" style="font-weight:800;color:#059669;">${fmtCurrency(data.feeAmount)}</span>
          </div>
        </div>

        <div class="row">
          <span class="row-label">Payment Mode</span>
          <span class="row-sep">:</span>
          <span class="row-value">${paymentDisplay}</span>
        </div>
      </div>

      <!-- Photo -->
      <div class="photo-col">
        <div class="photo-frame">
          ${data.photoUrl ? `<img src="${data.photoUrl}" alt="Student" crossorigin="anonymous" />` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94A3B8;font-size:7pt;">No Photo</div>'}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="validity-badge">
        Valid till : <span>${fmtDate(data.validityDate)}</span>
      </div>
      <div class="signature">
        <div class="sig-company">For MADHAV ENTERPRISE</div>
        <div class="sig-line"></div>
        <div class="sig-text">Authorised Signatory</div>
      </div>
    </div>

  </div>
</div>

<script>
  // Wait for image to load then print
  const img = document.querySelector('.photo-frame img');
  if (img && !img.complete) {
    img.onload = () => setTimeout(() => window.print(), 300);
    img.onerror = () => setTimeout(() => window.print(), 300);
  } else {
    setTimeout(() => window.print(), 500);
  }
</script>

</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
    }
  }, [receiptData]);

  if (!receiptData) return null;

  const data = receiptData;
  const yearLabel = YEAR_MAP[data.year] || data.year;
  const shiftLabel = SHIFT_MAP[data.shift] || data.shift;
  const deptLabel = data.department?.label || data.department || "—";
  const pickupLabel = data.pickupPoint?.label || data.pickupPoint || "—";
  const paymentDisplay = getPaymentModeDisplay(data);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Dialog Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          borderBottom: "1px solid #E2E8F0",
          bgcolor: "#FAFBFC",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "#ECFDF5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>✓</span>
          </Box>
          <Box>
            <p
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: "1rem",
                color: "#0F172A",
              }}
            >
              Receipt Generated
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "#64748B",
              }}
            >
              {data.receiptNumber} — {data.fullName}
            </p>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<PrintOutlined />}
            onClick={handlePrint}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#2563EB",
              "&:hover": { bgcolor: "#1D4ED8" },
            }}
          >
            Print Receipt
          </Button>
          <IconButton onClick={onClose} size="small">
            <CloseOutlined />
          </IconButton>
        </Box>
      </Box>

      {/* Preview */}
      <DialogContent
        sx={{
          p: 3,
          bgcolor: "#F1F5F9",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <Box
          ref={receiptRef}
          sx={{
            width: "100%",
            maxWidth: "720px",
            bgcolor: "white",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Receipt Preview Card */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Top: Date + Company + Receipt Badge */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "2.5px solid #0F172A",
                pb: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.68rem",
                    color: "#64748B",
                  }}
                >
                  Date : {fmtDateTime(data.approvedAt)}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "1.3rem",
                    fontWeight: 900,
                    color: "#0F172A",
                    letterSpacing: "0.5px",
                  }}
                >
                  MADHAV ENTERPRISE
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.7rem",
                    color: "#64748B",
                  }}
                >
                  Mobile No.: 8347125664
                </p>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Box
                  sx={{
                    display: "inline-block",
                    bgcolor: "#1E3A8A",
                    color: "white",
                    px: 2,
                    py: 0.5,
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    letterSpacing: "1px",
                    mb: 0.5,
                  }}
                >
                  RECEIPT
                </Box>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "#DC2626",
                  }}
                >
                  Sr. No. {data.receiptNumber}
                </p>
              </Box>
            </Box>

            {/* Shift bar */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                px: 2,
                py: 0.75,
                mb: 1.5,
                fontSize: "0.75rem",
              }}
            >
              <span>
                Shift:{" "}
                <strong style={{ color: "#0F172A" }}>{shiftLabel}</strong>
              </span>
              <span style={{ color: "#94A3B8", fontSize: "0.7rem" }}>
                Academic Year 2025-2026
              </span>
            </Box>

            {/* Ack text */}
            <p
              style={{
                margin: "0 0 12px",
                textAlign: "center",
                fontSize: "0.72rem",
                color: "#64748B",
                fontStyle: "italic",
                borderTop: "1px solid #F1F5F9",
                borderBottom: "1px solid #F1F5F9",
                padding: "6px 0",
              }}
            >
              Received with thanks towards the Transportation Fees for the
              Academic Year.
            </p>

            {/* Content: Details + Photo */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                {[
                  ["Name of the Student", data.fullName],
                  [
                    "YEAR / SEMESTER",
                    `${yearLabel}  ·  ${data.semester || "—"}`,
                  ],
                  ["BRANCH", deptLabel],
                  ["Enroll/ID No.", data.enrollmentNumber || "No ID"],
                  ["PICK-UP POINT", pickupLabel],
                  ["Amount(₹)", fmtCurrency(data.feeAmount)],
                  ["Payment Mode", paymentDisplay],
                ].map(([label, value], i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      py: 0.4,
                      fontSize: "0.78rem",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#475569",
                        minWidth: "130px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ margin: "0 6px", color: "#94A3B8" }}>:</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#0F172A",
                        flex: 1,
                        borderBottom: "1px dotted #CBD5E1",
                        paddingBottom: "1px",
                      }}
                    >
                      {value}
                    </span>
                  </Box>
                ))}
              </Box>

              {/* Photo preview with anti-tamper overlay */}
              <Box
                sx={{
                  width: 90,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 85,
                    height: 100,
                    borderRadius: "8px",
                    border: "1.5px solid #CBD5E1",
                    bgcolor: "#F8FAFC",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    component="img"
                    src={data.photoUrl}
                    alt="Student"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.7,
                    }}
                  />
                  {/* Anti-tamper SVG overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: 0.4,
                      zIndex: 1,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3Cpattern id='g' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 10h20M10 0v20' stroke='%230F172A' stroke-width='0.3' opacity='0.35'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23g)'/%3E%3Ccircle cx='100' cy='100' r='70' fill='none' stroke='%230F172A' stroke-width='1' opacity='0.3'/%3E%3Ccircle cx='100' cy='100' r='55' fill='none' stroke='%230F172A' stroke-width='0.5' opacity='0.25'/%3E%3Ccircle cx='100' cy='100' r='40' fill='none' stroke='%230F172A' stroke-width='0.8' opacity='0.3'/%3E%3Cpath d='M100 30L115 70H85Z' fill='none' stroke='%230F172A' stroke-width='0.6' opacity='0.25'/%3E%3Cpath d='M100 170L85 130H115Z' fill='none' stroke='%230F172A' stroke-width='0.6' opacity='0.25'/%3E%3Cpath d='M30 100L70 85V115Z' fill='none' stroke='%230F172A' stroke-width='0.6' opacity='0.25'/%3E%3Cpath d='M170 100L130 115V85Z' fill='none' stroke='%230F172A' stroke-width='0.6' opacity='0.25'/%3E%3Ctext x='100' y='105' text-anchor='middle' font-size='18' font-weight='900' fill='%230F172A' opacity='0.18' font-family='sans-serif'%3EME%3C/text%3E%3C/svg%3E")`,
                      backgroundSize: "cover",
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                pt: 1.5,
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "6px",
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#DC2626",
                }}
              >
                Valid till :{" "}
                <span style={{ color: "#0F172A", fontWeight: 800 }}>
                  {fmtDate(data.validityDate)}
                </span>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: "0 0 16px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "#0F172A",
                  }}
                >
                  For MADHAV ENTERPRISE
                </p>
                <Box
                  sx={{
                    width: 120,
                    borderTop: "1px solid #334155",
                    ml: "auto",
                  }}
                />
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "0.65rem",
                    color: "#64748B",
                    fontStyle: "italic",
                    textAlign: "right",
                  }}
                >
                  Authorised Signatory
                </p>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
