/**
 * Helper function to identify special case students requiring special verification
 * and transportation fee office visits:
 * 1. 4th Year B.CSE, B.CV, B.IT, B.EE, B.ME, B.CE, B.CHEM, B.Pharm
 * 2. 3rd Year D.CSE, D.CV, D.IT, D.EE, D.ME, D.CE, D.CHEM
 */
export function isSpecialCaseStudent(studentOrFormData) {
  if (!studentOrFormData) return false;

  const yearStr = String(studentOrFormData.year || "").trim();
  const deptLabel = (
    typeof studentOrFormData.department === "string"
      ? studentOrFormData.department
      : studentOrFormData.department?.label ||
        studentOrFormData.department?.name ||
        studentOrFormData.department?.code ||
        ""
  )
    .toUpperCase()
    .trim();

  if (!yearStr || !deptLabel) return false;

  // 4th Year degree branches: B.CSE, B.CV, B.IT, B.EE, B.ME, B.CE, B.CHEM, B.Pharm
  if (yearStr === "4") {
    const year4Targets = [
      "B.CSE",
      "B.CV",
      "B.IT",
      "B.EE",
      "B.ME",
      "B.CE",
      "B.CHEM",
      "BCSE",
      "BCV",
      "BIT",
      "BEE",
      "BME",
      "BCE",
      "BCHEM",
      "B.PHARM",
      "BPHARM",
      "B.PHARMA",
      "BPHARMA",
      "B.PHARMACY",
      "BPHARMACY",
    ];
    return year4Targets.some((t) => deptLabel.includes(t));
  }

  // 3rd Year diploma branches: D.CSE, D.CV, D.IT, D.EE, D.ME, D.CE, D.CHEM
  if (yearStr === "3") {
    const year3Targets = [
      "D.CSE",
      "D.CV",
      "D.IT",
      "D.EE",
      "D.ME",
      "D.CE",
      "D.CHEM",
      "DCSE",
      "DCV",
      "DIT",
      "DEE",
      "DME",
      "DCE",
      "DCHEM",
    ];
    return year3Targets.some((t) => deptLabel.includes(t));
  }

  return false;
}
