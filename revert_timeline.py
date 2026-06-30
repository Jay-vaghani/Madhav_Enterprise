import re
import sys

with open('src/features/staff/pages/StaffManagementPage.jsx', 'r') as f:
    content = f.read()

# Remove timeline generator
timeline_pattern = r'// ─── Timeline Generator ────────────────────────────────────────────────────────.*?// ─── Main Page ────────────────────────────────────────────────────────────────'
content = re.sub(timeline_pattern, '// ─── Main Page ────────────────────────────────────────────────────────────────', content, flags=re.DOTALL)

# Revert rendering in detailTab === 1
timeline_render = r'{renderPaymentTimeline\(staffDetails, setManualForm, setShowManualModal, handleApprovePayment\)}'
old_rendering = """{!staffDetails.payments || staffDetails.payments.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 5, border: "1px dashed #CBD5E1", borderRadius: "12px" }}>
                          <Typography sx={{ color: "#94A3B8" }}>No payments recorded yet.</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                          {[...staffDetails.payments]
                            .sort((a, b) => b.forYear - a.forYear || b.forMonth - a.forMonth)
                            .map((p) => (
                              <PaymentRow
                                key={p._id}
                                payment={p}
                                onApprove={handleApprovePayment}
                                onManualEntry={() => {
                                  setManualForm((prev) => ({
                                    ...prev,
                                    staffId: staffDetails,
                                    amount: p.amount || staffDetails.pickupPoint?.fee,
                                    forMonth: p.forMonth,
                                    forYear: p.forYear
                                  }));
                                  setShowManualModal(true);
                                }}
                              />
                            ))}
                        </Box>
                      )}"""
content = content.replace(timeline_render, old_rendering)

# Now add the Manual Entry button to PaymentRow
payment_row_action_old = """{payment.status === "submitted" && (
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<CheckCircleOutlineOutlined />}
              onClick={() => setOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                borderRadius: "8px",
              }}
            >
              Approve
            </Button>
          )}"""

payment_row_action_new = """{payment.status === "submitted" && (
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<CheckCircleOutlineOutlined />}
              onClick={() => setOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                borderRadius: "8px",
              }}
            >
              Approve
            </Button>
          )}
          {payment.status === "pending" && onManualEntry && (
            <Button
              variant="outlined"
              size="small"
              onClick={onManualEntry}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                borderRadius: "8px",
              }}
            >
              Manual Entry
            </Button>
          )}"""

content = content.replace(payment_row_action_old, payment_row_action_new)

# Make sure PaymentRow accepts onManualEntry
content = content.replace('function PaymentRow({ payment, onApprove }) {', 'function PaymentRow({ payment, onApprove, onManualEntry }) {')


with open('src/features/staff/pages/StaffManagementPage.jsx', 'w') as f:
    f.write(content)

