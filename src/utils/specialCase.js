/**
 * Helper function to identify 2nd Year Degree students (B.CSE, B.CV, B.IT, B.EE, B.ME, B.CE, B.CHEM)
 */
export function isSecondYearDegreeStudent(studentOrFormData) {
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

  if (yearStr !== "2" || !deptLabel) return false;

  const year2Targets = [
    "B.CSE",
    "B.CV",
    "B.IT",
    "B.EE",
    "B.ME",
    "B.CE",
    "B.CHEM",
  ];
  return year2Targets.some((t) => deptLabel.includes(t));
}

/**
 * Helper function to identify special case students requiring special verification
 * and transportation fee office visits:
 * 1. 4th Year B.CSE, B.CV, B.IT, B.EE, B.ME, B.CE, B.CHEM, B.Pharm
 * 2. 3rd Year D.CSE, D.CV, D.IT, D.EE, D.ME, D.CE, D.CHEM
 * 3. 2nd Year B.CSE, B.CV, B.IT, B.EE, B.ME, B.CE, B.CHEM who completed 3-year Diploma from KPGU
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
      "B.PHARM",
    ];
    if (year4Targets.some((t) => deptLabel.includes(t))) return true;
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
    ];
    if (year3Targets.some((t) => deptLabel.includes(t))) return true;
  }

  // 2nd Year degree branches who completed 3-Year Diploma from KPGU
  if (yearStr === "2" && isSecondYearDegreeStudent(studentOrFormData)) {
    if (
      studentOrFormData.completedKpguDiploma ||
      studentOrFormData.isKpguDiploma
    ) {
      return true;
    }
  }

  return false;
}
