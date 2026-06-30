import re
import sys

with open('src/features/staff/pages/StaffManagementPage.jsx', 'r') as f:
    content = f.read()

# 1. Update Accounts in PaymentRow
content = content.replace('<MenuItem value="A">Account A</MenuItem>', '<MenuItem value="C">Account C</MenuItem>')
content = content.replace('<MenuItem value="B">Account B</MenuItem>', '<MenuItem value="H">Account H</MenuItem>')

# 2. In PaymentRow Approve Dialog, hide UTR if Cash and use type="tel"
utr_approve = """<TextField
              label="UTR / Transaction Number"
              fullWidth
              size="small"
              value={approveForm.utrNumber}
              onChange={(e) =>
                setApproveForm((prev) => ({
                  ...prev,
                  utrNumber: e.target.value,
                }))
              }
            />"""
utr_approve_new = """{approveForm.account !== "Cash" && (
              <TextField
                label="UTR / Transaction Number (12 Digits)"
                fullWidth
                size="small"
                type="tel"
                inputProps={{ maxLength: 12 }}
                value={approveForm.utrNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 12) {
                    setApproveForm((prev) => ({ ...prev, utrNumber: val }));
                  }
                }}
              />
            )}"""
content = content.replace(utr_approve, utr_approve_new)

# 3. In PaymentRow handleApprove
approve_logic = """const handleApprove = async () => {
    if (!approveForm.account) {
      alert("Please select an account.");
      return;
    }"""
approve_logic_new = """const handleApprove = async () => {
    if (!approveForm.account) {
      alert("Please select an account.");
      return;
    }
    if (approveForm.account !== "Cash" && (!approveForm.utrNumber || approveForm.utrNumber.length !== 12)) {
      alert("Please enter a valid 12-digit UTR number.");
      return;
    }"""
content = content.replace(approve_logic, approve_logic_new)

# 4. Remove Manual Entry Button from header
manual_btn = """<Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddCardOutlined />}
                          onClick={() => {
                            setManualForm((prev) => ({
                              ...prev,
                              staffId: staffDetails,
                              amount: staffDetails.pickupPoint?.fee,
                            }));
                            setShowManualModal(true);
                          }}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: "8px",
                          }}
                        >
                          Manual Entry
                        </Button>"""
content = content.replace(manual_btn, "")

# 5. Insert Timeline renderer before Main Page
timeline_func = """
// ─── Timeline Generator ────────────────────────────────────────────────────────

const renderPaymentTimeline = (staffDetails, setManualForm, setShowManualModal, handleApprovePayment) => {
  if (!staffDetails) return null;
  const start = new Date(staffDetails.serviceStartDate || staffDetails.joiningDate || new Date());
  const end = new Date();
  end.setMonth(end.getMonth() + 1); // Include up to next month
  
  const timeline = [];
  let curr = new Date(start.getFullYear(), start.getMonth(), 1);
  const endDate = new Date(end.getFullYear(), end.getMonth(), 1);
  
  while (curr <= endDate) {
    timeline.push({ month: curr.getMonth() + 1, year: curr.getFullYear() });
    curr.setMonth(curr.getMonth() + 1);
  }
  
  const existingPayments = staffDetails.payments || [];
  existingPayments.forEach(p => {
    if (!timeline.find(t => t.month === p.forMonth && t.year === p.forYear)) {
      timeline.push({ month: p.forMonth, year: p.forYear });
    }
  });
  
  timeline.sort((a, b) => b.year - a.year || b.month - a.month);
  
  return timeline.map(t => {
    const payment = existingPayments.find(p => p.forMonth === t.month && p.forYear === t.year);
    if (payment) {
      return (
        <Box sx={{ mb: 1.5 }} key={payment._id}>
          <PaymentRow payment={payment} onApprove={handleApprovePayment} />
        </Box>
      );
    } else {
      return (
        <Box key={`unpaid-${t.year}-${t.month}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px dashed #CBD5E1', borderRadius: '10px', bgcolor: '#F8FAFC', mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#64748B' }}>{FULL_MONTH_NAMES[t.month]} {t.year}</Typography>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>No payment recorded</Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={() => {
            setManualForm(prev => ({ ...prev, staffId: staffDetails, amount: staffDetails.pickupPoint?.fee, forMonth: t.month, forYear: t.year }));
            setShowManualModal(true);
          }}>Manual Entry</Button>
        </Box>
      );
    }
  });
};

// ─── Main Page ────────────────────────────────────────────────────────────────"""
content = content.replace("// ─── Main Page ────────────────────────────────────────────────────────────────", timeline_func)

# 6. Replace payment history rendering
old_rendering = """{!staffDetails.payments ||
                      staffDetails.payments.length === 0 ? (
                        <Box
                          sx={{
                            textAlign: "center",
                            py: 5,
                            border: "1px dashed #CBD5E1",
                            borderRadius: "12px",
                          }}
                        >
                          <Typography sx={{ color: "#94A3B8" }}>
                            No payments recorded yet.
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          {[...staffDetails.payments]
                            .sort(
                              (a, b) =>
                                b.forYear - a.forYear ||
                                b.forMonth - a.forMonth,
                            )
                            .map((p) => (
                              <PaymentRow
                                key={p._id}
                                payment={p}
                                onApprove={handleApprovePayment}
                              />
                            ))}
                        </Box>
                      )}"""
new_rendering = """{renderPaymentTimeline(staffDetails, setManualForm, setShowManualModal, handleApprovePayment)}"""
content = content.replace(old_rendering, new_rendering)


# 7. Update manual modal HandleSubmit
manual_submit = """const handleManualSubmit = async () => {
    if (
      !manualForm.staffId ||
      !manualForm.forMonth ||
      !manualForm.forYear ||
      !manualForm.amount ||
      !manualForm.account
    ) {
      showSnackbar("Please fill all required fields.", "error");
      return;
    }"""
manual_submit_new = """const handleManualSubmit = async () => {
    if (
      !manualForm.staffId ||
      !manualForm.forMonth ||
      !manualForm.forYear ||
      !manualForm.amount ||
      !manualForm.account
    ) {
      showSnackbar("Please fill all required fields.", "error");
      return;
    }
    if (manualForm.account !== "Cash" && (!manualForm.utrNumber || manualForm.utrNumber.length !== 12)) {
      showSnackbar("Please enter a valid 12-digit UTR number.", "error");
      return;
    }"""
content = content.replace(manual_submit, manual_submit_new)

# 8. Update Manual Modal Inputs
# Change type="number" to type="tel" for Amount
content = content.replace('label="Amount (₹) *"\n              fullWidth\n              type="number"', 'label="Amount (₹) *"\n              fullWidth\n              type="tel"')
# Hide forMonth and forYear because it's prefilled, and change UTR logic
# The forMonth and forYear are inside a <Box sx={{ display: "flex", gap: 2 }}>
# We'll just replace the Box containing Month and Year to be readOnly or disabled
# Instead of regex, I'll just change the UTR part first

manual_utr_old = """<TextField
              label="UTR / Transaction Number"
              fullWidth
              value={manualForm.utrNumber}
              onChange={(e) =>
                setManualForm((prev) => ({
                  ...prev,
                  utrNumber: e.target.value,
                }))
              }
            />"""
manual_utr_new = """{manualForm.account !== "Cash" && (
              <TextField
                label="UTR / Transaction Number (12 Digits)"
                fullWidth
                type="tel"
                inputProps={{ maxLength: 12 }}
                value={manualForm.utrNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 12) {
                    setManualForm((prev) => ({ ...prev, utrNumber: val }));
                  }
                }}
              />
            )}"""
content = content.replace(manual_utr_old, manual_utr_new)

# Change Account A and B to C and H in manual form
content = content.replace('<MenuItem value="A">Account A</MenuItem>', '<MenuItem value="C">Account C</MenuItem>')
content = content.replace('<MenuItem value="B">Account B</MenuItem>', '<MenuItem value="H">Account H</MenuItem>')

# Fix type="number" for mobile in StaffRegistrationPage? No, just the ones in this file and Payments page
# Fix type="number" for month and year in manual form
content = content.replace('label="Year *"\n                fullWidth\n                type="number"', 'label="Year *"\n                fullWidth\n                type="tel"\n                disabled')
content = content.replace('label="Month *"\n                fullWidth\n                value={manualForm.forMonth}', 'label="Month *"\n                fullWidth\n                disabled\n                value={manualForm.forMonth}')

with open('src/features/staff/pages/StaffManagementPage.jsx', 'w') as f:
    f.write(content)

