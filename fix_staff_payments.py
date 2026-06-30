import re
import sys

with open('src/features/staff/pages/StaffPaymentsPage.jsx', 'r') as f:
    content = f.read()

# 1. Update Accounts
content = content.replace('<MenuItem value="A">Account A</MenuItem>', '<MenuItem value="C">Account C</MenuItem>')
content = content.replace('<MenuItem value="B">Account B</MenuItem>', '<MenuItem value="H">Account H</MenuItem>')

# 2. Manual Modal handleSubmit
manual_submit = """const handleManualSubmit = async () => {
    if (
      !manualForm.staffId ||
      !manualForm.forMonth ||
      !manualForm.forYear ||
      !manualForm.amount ||
      !manualForm.account
    ) {
      alert("Please fill all required fields.");
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
      alert("Please fill all required fields.");
      return;
    }
    if (manualForm.account !== "Cash" && (!manualForm.utrNumber || manualForm.utrNumber.length !== 12)) {
      alert("Please enter a valid 12-digit UTR number.");
      return;
    }"""
content = content.replace(manual_submit, manual_submit_new)

# 3. Approve HandleSubmit
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


# 4. Inputs from number to tel
content = content.replace('label="Year *"\n                fullWidth\n                type="number"', 'label="Year *"\n                fullWidth\n                type="tel"')
content = content.replace('label="Amount (₹) *"\n              fullWidth\n              type="number"', 'label="Amount (₹) *"\n              fullWidth\n              type="tel"')


# 5. Manual Form UTR
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


# 6. Approve Form UTR
approve_utr_old = """<TextField
              label="UTR / Transaction Number"
              fullWidth
              value={approveForm.utrNumber}
              onChange={(e) =>
                setApproveForm((prev) => ({
                  ...prev,
                  utrNumber: e.target.value,
                }))
              }
              helperText="Enter the UTR number verified from the screenshot."
            />"""
approve_utr_new = """{approveForm.account !== "Cash" && (
              <TextField
                label="UTR / Transaction Number (12 Digits)"
                fullWidth
                type="tel"
                inputProps={{ maxLength: 12 }}
                value={approveForm.utrNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 12) {
                    setApproveForm((prev) => ({ ...prev, utrNumber: val }));
                  }
                }}
                helperText="Enter the 12-digit UTR number verified from the screenshot."
              />
            )}"""
content = content.replace(approve_utr_old, approve_utr_new)

with open('src/features/staff/pages/StaffPaymentsPage.jsx', 'w') as f:
    f.write(content)

