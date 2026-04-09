/** Returns true when all required fields for the given step are filled */
export function isStepComplete(step, data) {
  switch (step) {
    case 1:
      return !!(
        data.fullName?.trim() &&
        data.mobile?.trim() &&
        data.guardianMobile?.trim() &&
        data.pinCode?.trim() &&
        data.permanentAddress?.trim()
      );
    case 2:
      return !!(
        data.enrollmentNumber?.trim() &&
        data.year &&
        data.department &&
        data.shift
      );
    case 3:
      return !!data.pickupPoint;
    case 4:
      return !!(data.photoBase64 && data.termsAccepted);
    default:
      return true;
  }
}

/** Human-readable hint of what is missing */
export function getMissingHint(step, data) {
  const missing = [];
  if (step === 1) {
    if (!data.fullName?.trim()) missing.push("Full Name");
    if (!data.mobile?.trim()) missing.push("Student Mobile");
    if (!data.guardianMobile?.trim()) missing.push("Guardian Mobile");
    if (!data.pinCode?.trim()) missing.push("PIN Code");
    if (!data.permanentAddress?.trim()) missing.push("Address");
  }
  if (step === 2) {
    if (!data.enrollmentNumber?.trim()) missing.push("Enrollment No.");
    if (!data.year) missing.push("Year");
    if (!data.department) missing.push("Department");
    if (!data.shift) missing.push("Shift");
  }
  if (step === 3) {
    if (!data.pickupPoint) missing.push("Pickup Point");
  }
  if (step === 4) {
    if (!data.photoBase64) missing.push("Identity Photo");
    if (!data.termsAccepted) missing.push("Terms & Conditions");
  }
  return missing.length ? `Required: ${missing.join(", ")}` : "";
}
