import React, { useRef, useCallback } from "react";
import { Dialog, DialogContent, Button, Box, IconButton } from "@mui/material";
import { CloseOutlined, PrintOutlined } from "@mui/icons-material";

const fmtDate = (d) => {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

const fmtDateTime = (d) => {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}/-`;

const getPaymentModeDisplay = (data) => {
  if (!data) return "—";
  const { paymentMethod, transaction1, transaction2 } = data;

  if (paymentMethod === "cash") return "OFFLINE PAYMENT";
  const txns = [transaction1, transaction2].filter(Boolean).join(" | ");
  if (paymentMethod === "bank") return `ONLINE ${txns}`;
  if (paymentMethod === "both") return `ONLINE ${txns} + CASH`;
  return "—";
};

export default function TempPassReceiptDialog({ open, receiptData, onClose }) {
  const handlePrint = useCallback(() => {
    if (!receiptData) return;

    const data = receiptData;
    const deptLabel = data.department?.label || data.department || "—";
    const pickupLabel = data.pickupPoint?.label || data.pickupPoint || "—";
    const paymentDisplay = getPaymentModeDisplay(data);

    const printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Temp Pass ${data.receiptNumber}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .receipt-page {
    width: 210mm; height: 99mm; padding: 5mm 8mm; position: relative;
    overflow: hidden; page-break-after: always; border-bottom: 2px dashed #999;
  }
  .receipt-page::before {
    content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 90mm; height: 90mm; background-image: url('https://ik.imagekit.io/JayVaghani2002/Royal-Travels-Logo.jpg');
    background-size: contain; background-repeat: no-repeat; opacity: 0.15; z-index: 0;
  }
  .receipt-inner { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }
  .header { display: flex; align-items: flex-start; border-bottom: 2.5px solid #1a1a1a; padding-bottom: 2.5mm; margin-bottom: 1.5mm; }
  .header-left { width: 40mm; }
  .header-center { flex: 1; text-align: center; }
  .company-name { font-size: 16pt; font-weight: 900; color: #0F172A; letter-spacing: 1px; }
  .receipt-title { font-size: 10pt; font-weight: 800; color: #DC2626; letter-spacing: 1px; }
  .company-contact { font-size: 8.5pt; color: #555; margin-top: 0.5mm; }
  .header-right { width: 38mm; text-align: center; }
  .receipt-badge { background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 1.5mm; padding: 1.5mm 3mm; margin-bottom: 1.5mm; font-size: 9pt; font-weight: 800; }
  .sr-no { font-size: 11pt; font-weight: 800; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 1.5mm 3mm; border-radius: 1.5mm; }
  
  .trip-bar { display: flex; justify-content: space-between; align-items: center; background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 1.5mm; padding: 1.5mm 3mm; margin-bottom: 1.5mm; font-size: 9.5pt; font-weight: 800; }
  
  .content { flex: 1; display: flex; flex-direction: column; gap: 2mm; margin-top: 2mm; }
  .row { display: flex; font-size: 10pt; align-items: baseline; }
  .row-label { font-weight: 700; width: 35mm; color: #334155; }
  .row-sep { margin: 0 2mm; }
  .row-value { flex: 1; font-weight: 800; border-bottom: 0.5px dotted #CBD5E1; color: #0F172A; }
  
  .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 2mm; }
  .validity-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 1.5mm; padding: 2mm 3mm; font-size: 9.5pt; font-weight: 700; color: #DC2626; }
  .validity-box span { color: #0F172A; font-weight: 900; margin-left: 2mm; }
  .signature { text-align: right; }
  .sig-company { font-size: 9pt; font-weight: 800; margin-bottom: 12mm; }
  .sig-line { width: 35mm; border-top: 1px solid #334155; margin-left: auto; }
  .sig-text { font-size: 8pt; color: #64748B; font-style: italic; margin-top: 0.5mm; text-align: right; }
  
  @media print { body { margin: 0; } .receipt-page { border-bottom: 2px dashed #999; } }
</style>
</head>
<body>
<div class="receipt-page">
  <div class="receipt-inner">
    <div class="header">
      <div class="header-left">
        <div class="receipt-badge">Date: ${fmtDateTime(data.createdAt || new Date())}</div>
      </div>
      <div class="header-center">
        <div class="receipt-title">TEMPORARY PASS</div>
        <div class="company-name">MADHAV ENTERPRISE</div>
        <div class="company-contact">Mobile No.: 8347125664</div>
      </div>
      <div class="header-right">
        <div class="sr-no">Sr. No. ${data.receiptNumber}</div>
      </div>
    </div>
    
    <div class="trip-bar">
      <div>Trip Type: <span>${data.tripType}</span></div>
    </div>
    
    <div class="content">
      <div class="row">
        <span class="row-label">Student Name</span><span class="row-sep">:</span>
        <span class="row-value" style="font-size: 11pt;">${data.studentName}</span>
      </div>
      <div class="row">
        <span class="row-label">Mobile Number</span><span class="row-sep">:</span>
        <span class="row-value">${data.mobileNumber}</span>
      </div>
      <div class="row">
        <span class="row-label">Department</span><span class="row-sep">:</span>
        <span class="row-value">${deptLabel}</span>
      </div>
      <div class="row">
        <span class="row-label">Pick-up Point</span><span class="row-sep">:</span>
        <span class="row-value">${pickupLabel}</span>
      </div>
      <div class="row" style="display:flex; gap: 5mm;">
        <div style="flex:1; display:flex;">
          <span class="row-label" style="width:28mm;">Payment Mode</span><span class="row-sep">:</span>
          <span class="row-value" style="font-size: 9pt;">${paymentDisplay}</span>
        </div>
        <div style="display:flex; width: 45mm;">
          <span class="row-label" style="width:20mm;">Amount(₹)</span><span class="row-sep">:</span>
          <span class="row-value">${fmtCurrency(data.feeAmount)}</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div class="validity-box">
        <div>Valid From: <span>${fmtDate(data.validFrom)}</span></div>
        <div style="margin-top: 1mm;">Valid To: <span>${fmtDate(data.validTo)}</span></div>
      </div>
      <div class="signature">
        <div class="sig-company">For MADHAV ENTERPRISE</div>
        <div class="sig-line"></div>
        <div class="sig-text">Authorised Signatory</div>
      </div>
    </div>
  </div>
</div>
<script>setTimeout(() => window.print(), 300);</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
    }
  }, [receiptData]);

  if (!receiptData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 2, borderBottom: "1px solid #E2E8F0", bgcolor: "#FAFBFC" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "1.2rem" }}>✓</span>
          </Box>
          <Box>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: "#0F172A" }}>Pass Generated</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B" }}>{receiptData.receiptNumber} — {receiptData.studentName}</p>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" startIcon={<PrintOutlined />} onClick={handlePrint} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, bgcolor: "#2563EB", "&:hover": { bgcolor: "#1D4ED8" } }}>
            Print Pass
          </Button>
          <IconButton onClick={onClose} size="small"><CloseOutlined /></IconButton>
        </Box>
      </Box>
      <DialogContent sx={{ p: 3, bgcolor: "#F1F5F9" }}>
        <Box sx={{ p: 3, bgcolor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", textAlign: "center" }}>
          <p style={{ fontWeight: 800, fontSize: "1.2rem", margin: "0 0 10px" }}>{receiptData.tripType}</p>
          <p style={{ color: "#64748B", margin: "0 0 10px" }}>Valid: {fmtDate(receiptData.validFrom)} to {fmtDate(receiptData.validTo)}</p>
          <p style={{ fontWeight: 600, margin: 0 }}>Fee Paid: {fmtCurrency(receiptData.feeAmount)}</p>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
