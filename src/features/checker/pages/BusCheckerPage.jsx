import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Avatar,
  CircularProgress,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Fab,
  Autocomplete,
} from "@mui/material";
import {
  DirectionsBus,
  Logout,
  LocationOn,
  AccessTime,
  Add,
  WarningAmber,
  Search,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  getStudentByReceipt,
  searchStudentByName,
  searchStudentByPickupPoint,
  searchStudentByDepartment,
} from "../../../api/checker/api";
import { getPublicSettings } from "../../../api/public/api";
import { checkOffenceHistory } from "../../../api/checker/confiscationApi";
import ConfiscationFormSheet from "../components/ConfiscationFormSheet";

// Helper to get cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function BusCheckerPage() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState("receipt");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchPickupPoint, setSearchPickupPoint] = useState("");
  const [searchDepartment, setSearchDepartment] = useState("");
  const [pickupOptions, setPickupOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicSettings()
      .then((res) => {
        if (res?.success && res.pickupPoints) {
          setPickupOptions(res.pickupPoints.map((p) => p.label));
        }
        if (res?.success && res.departments) {
          setDepartmentOptions(res.departments.map((d) => d.label));
        }
      })
      .catch((err) => console.error("Failed to fetch pickup points", err));
  }, []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const token = getCookie("checkerToken");

  useEffect(() => {
    if (!token) {
      navigate("/checker/login", { replace: true });
    }
  }, [navigate, token]);

  const handleLogout = () => {
    document.cookie =
      "checkerToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/checker/login", { replace: true });
  };

  // Search when user types receipt number (with debounce for length >= 3)
  useEffect(() => {
    if (searchType === "receipt") {
      const trimmedReceipt = receiptNumber.trim();
      if (trimmedReceipt.length === 0) {
        setStudents([]);
        setError("");
        return;
      }
      setLoading(true);
      setError("");

      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await getStudentByReceipt(trimmedReceipt, token);
          if (res.success && res.data) {
            const enrichedStudents = await Promise.all(
              res.data.map(async (student) => {
                if (student.mobile) {
                  const histRes = await checkOffenceHistory(
                    student.mobile,
                    token,
                  );
                  if (histRes && histRes.success) {
                    student.offenceCount = histRes.offenceCount;
                  }
                }
                return student;
              }),
            );
            setStudents(enrichedStudents);
          } else {
            setStudents([]);
            setError("No student found");
          }
        } catch (err) {
          setStudents([]);
          setError("Student not found or invalid receipt");
        } finally {
          setLoading(false);
        }
      }, 600);
      return () => clearTimeout(delayDebounceFn);
    } else if (searchType === "name") {
      const trimmedName = searchName.trim();
      if (trimmedName.length < 2) {
        setStudents([]);
        setError("");
        return;
      }
      setLoading(true);
      setError("");

      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await searchStudentByName(trimmedName, token);
          if (res.success && res.data) {
            const enrichedStudents = await Promise.all(
              res.data.map(async (student) => {
                if (student.mobile) {
                  const histRes = await checkOffenceHistory(
                    student.mobile,
                    token,
                  );
                  if (histRes && histRes.success) {
                    student.offenceCount = histRes.offenceCount;
                  }
                }
                return student;
              }),
            );
            setStudents(enrichedStudents);
          } else {
            setStudents([]);
            setError("No student found");
          }
        } catch (err) {
          setStudents([]);
          setError("No student found with that name");
        } finally {
          setLoading(false);
        }
      }, 800);
      return () => clearTimeout(delayDebounceFn);
    } else if (searchType === "pickupPoint") {
      const trimmedPickupPoint = searchPickupPoint.trim();
      if (trimmedPickupPoint.length < 2) {
        setStudents([]);
        setError("");
        return;
      }
      setLoading(true);
      setError("");

      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await searchStudentByPickupPoint(trimmedPickupPoint, token);
          if (res.success && res.data) {
            const enrichedStudents = await Promise.all(
              res.data.map(async (student) => {
                if (student.mobile) {
                  const histRes = await checkOffenceHistory(student.mobile, token);
                  if (histRes && histRes.success) {
                    student.offenceCount = histRes.offenceCount;
                  }
                }
                return student;
              }),
            );
            setStudents(enrichedStudents);
          } else {
            setStudents([]);
            setError("No student found");
          }
        } catch (err) {
          setStudents([]);
          setError("No student found for that pickup point");
        } finally {
          setLoading(false);
        }
      }, 800);
      return () => clearTimeout(delayDebounceFn);
    } else if (searchType === "department") {
      const trimmedDept = searchDepartment.trim();
      if (trimmedDept.length < 2) {
        setStudents([]);
        setError("");
        return;
      }
      setLoading(true);
      setError("");

      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await searchStudentByDepartment(trimmedDept, token);
          if (res.success && res.data) {
            const enrichedStudents = await Promise.all(
              res.data.map(async (student) => {
                if (student.mobile) {
                  const histRes = await checkOffenceHistory(student.mobile, token);
                  if (histRes && histRes.success) {
                    student.offenceCount = histRes.offenceCount;
                  }
                }
                return student;
              }),
            );
            setStudents(enrichedStudents);
          } else {
            setStudents([]);
            setError("No student found");
          }
        } catch (err) {
          setStudents([]);
          setError("No student found for that department");
        } finally {
          setLoading(false);
        }
      }, 800);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [receiptNumber, searchName, searchPickupPoint, searchDepartment, searchType, token]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F1F5F9",
        fontFamily: '"Inter", "Roboto", sans-serif',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "#fff",
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DirectionsBus sx={{ color: "#fff" }} />
          </Box>
          <Typography variant="h6" fontWeight="700" color="#0F172A">
            Bus Checker
          </Typography>
        </Box>
        <IconButton onClick={handleLogout} sx={{ color: "#EF4444" }}>
          <Logout />
        </IconButton>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 2, maxWidth: 500, mx: "auto", mt: 2 }}>
        {/* Search Mode Tabs */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: "20px",
            border: "1px solid",
            borderColor: "grey.200",
            mb: 2,
            boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
          }}
        >
          <Tabs
            value={searchType}
            onChange={(e, val) => {
              setSearchType(val);
              setStudents([]);
              setError("");
            }}
            variant="fullWidth"
            indicatorColor="none"
            TabIndicatorProps={{ style: { display: "none" } }}
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                minHeight: 44,
                borderRadius: "14px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "#64748B",
                "&.Mui-selected": {
                  color: "#10B981",
                  bgcolor: "#ECFDF5",
                },
              },
            }}
          >
            <Tab value="receipt" label="Receipt No." />
            <Tab value="name" label="Student Name" />
            <Tab value="pickupPoint" label="Pickup Point" />
            <Tab value="department" label="Department" />
          </Tabs>
        </Paper>

        {/* Input Area */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "20px",
            border: "1px solid",
            borderColor: "grey.200",
            mb: 3,
            boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: 600, color: "#334155" }}
          >
            {searchType === "receipt"
              ? "Enter Receipt Number"
              : searchType === "name"
              ? "Enter Student Name"
              : searchType === "department"
              ? "Select Department"
              : "Select Pickup Point"}
          </Typography>
          
          {searchType === "pickupPoint" || searchType === "department" ? (
            <Autocomplete
              freeSolo
              options={searchType === "department" ? departmentOptions : pickupOptions}
              getOptionLabel={(option) => (option ? String(option) : "")}
              value={searchType === "department" ? searchDepartment : searchPickupPoint}
              onChange={(event, newValue) => {
                searchType === "department"
                  ? setSearchDepartment(newValue || "")
                  : setSearchPickupPoint(newValue || "");
              }}
              onInputChange={(event, newInputValue) => {
                searchType === "department"
                  ? setSearchDepartment(newInputValue)
                  : setSearchPickupPoint(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={searchType === "department" ? "e.g. B.Tech Computer Science" : "e.g. Sahyog"}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 56,
                      borderRadius: "14px",
                      bgcolor: "#F8FAFC",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#10B981",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#10B981",
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              )}
            />
          ) : (
            <TextField
              fullWidth
              type={searchType === "receipt" ? "tel" : "text"}
              placeholder={
                searchType === "receipt" ? "e.g. 0001" : "e.g. Student Name"
              }
              value={searchType === "receipt" ? receiptNumber : searchName}
              onChange={(e) =>
                searchType === "receipt"
                  ? setReceiptNumber(e.target.value)
                  : setSearchName(e.target.value)
              }
              slotProps={{
                htmlInput: {
                  autoFocus: true,
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 56,
                  borderRadius: "14px",
                  bgcolor: "#F8FAFC",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#10B981",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#10B981",
                    borderWidth: 2,
                  },
                },
              }}
            />
          )}
        </Paper>

        {/* Results Area */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress sx={{ color: "#10B981" }} />
          </Box>
        )}

        {!loading && error && receiptNumber && (
          <Box
            sx={{
              bgcolor: "#FEF2F2",
              color: "#DC2626",
              p: 3,
              borderRadius: "16px",
              textAlign: "center",
              fontWeight: 600,
              border: "1px solid #FECACA",
            }}
          >
            {error}
          </Box>
        )}

        {!loading && students && students.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {students.map((student) => {
              const isValid = student.validityDate
                ? new Date(student.validityDate) >=
                  new Date(new Date().setHours(0, 0, 0, 0))
                : true;
              const accentColor = isValid ? "#10B981" : "#EF4444"; // Green or Red

              return (
                <React.Fragment key={student.id || student.receiptNumber}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor: isValid ? "grey.200" : "#FCA5A5",
                      bgcolor: isValid ? "#fff" : "#FEF2F2",
                      boxShadow: isValid
                        ? "0 10px 40px rgba(16,185,129,0.08)"
                        : "0 10px 40px rgba(239,68,68,0.08)",
                      textAlign: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "6px",
                        bgcolor: accentColor,
                      }}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        position: "absolute",
                        top: 16,
                        left: 16,
                        right: 16,
                      }}
                    >
                      {/* Validity Badge */}
                      <Box
                        sx={{
                          bgcolor: isValid ? "#D1FAE5" : "#FEE2E2",
                          color: isValid ? "#065F46" : "#991B1B",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "100px",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          border: `1px solid ${isValid ? "#A7F3D0" : "#FECACA"}`,
                        }}
                      >
                        <Typography variant="caption" fontWeight="800">
                          {new Date(student.validityDate).toLocaleDateString()}
                        </Typography>
                      </Box>

                      {/* Receipt Number Badge */}
                      <Box
                        sx={{
                          bgcolor: "#F1F5F9",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "100px",
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight="700"
                          color="#64748B"
                        >
                          {student.receiptNumber}
                        </Typography>
                      </Box>
                    </Box>

                    <Avatar
                      src={student.photoUrl}
                      alt={student.fullName}
                      sx={{
                        width: 100,
                        height: 100,
                        mx: "auto",
                        mb: 2,
                        border: "4px solid #fff",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        mt: 3,
                      }}
                    />

                    <Typography
                      variant="h5"
                      fontWeight="800"
                      color="#0F172A"
                      sx={{ mb: 0.5 }}
                    >
                      {student.fullName}
                    </Typography>
                    {student.year && (
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="#64748B"
                        sx={{ mb: 1 }}
                      >
                        Year {student.year}
                      </Typography>
                    )}
                    {student.validityDate && (
                      <Typography
                        variant="caption"
                        fontWeight="600"
                        color={isValid ? "#10B981" : "#EF4444"}
                        sx={{ display: "block", mb: 2 }}
                      >
                        {isValid ? "Valid until " : "Expired on "}
                        {new Date(student.validityDate).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        textAlign: "left",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box
                          sx={{
                            bgcolor: isValid ? "#ECFDF5" : "#FEF2F2",
                            p: 1,
                            borderRadius: "10px",
                            display: "flex",
                          }}
                        >
                          <LocationOn
                            sx={{ color: accentColor, fontSize: 20 }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="#64748B"
                            fontWeight="600"
                            display="block"
                          >
                            PICKUP POINT
                          </Typography>
                          <Typography
                            variant="body1"
                            color="#334155"
                            fontWeight="600"
                          >
                            {typeof student.pickupPoint === "object"
                              ? student.pickupPoint?.label ||
                                student.pickupPoint?.name ||
                                "N/A"
                              : student.pickupPoint || "N/A"}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box
                          sx={{
                            bgcolor: isValid ? "#F0F9FF" : "#FEF2F2",
                            p: 1,
                            borderRadius: "10px",
                            display: "flex",
                          }}
                        >
                          <AccessTime
                            sx={{
                              color: isValid ? "#0EA5E9" : "#EF4444",
                              fontSize: 20,
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="#64748B"
                            fontWeight="600"
                            display="block"
                          >
                            SHIFT
                          </Typography>
                          <Typography
                            variant="body1"
                            color="#334155"
                            fontWeight="600"
                          >
                            {typeof student.shift === "object"
                              ? student.shift?.label ||
                                student.shift?.name ||
                                "N/A"
                              : student.shift || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Repeat Offender Banner (rendered outside paper to stand out) */}
                  {student.offenceCount > 0 && (
                    <Box
                      sx={{
                        bgcolor: "#FFFBEB",
                        p: 2,
                        borderRadius: "16px",
                        border: "1px solid #FDE68A",
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                        mt: -1, // Pull it closer to the card
                      }}
                    >
                      <WarningAmber sx={{ color: "#D97706" }} />
                      <Box textAlign="left">
                        <Typography
                          variant="subtitle2"
                          color="#92400E"
                          fontWeight="700"
                        >
                          Repeat Offender Warning
                        </Typography>
                        <Typography
                          variant="caption"
                          color="#B45309"
                          fontWeight="600"
                        >
                          This student has been caught {student.offenceCount}{" "}
                          time(s) before without a pass.
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setSheetOpen(true)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          bgcolor: "#10B981",
          "&:hover": { bgcolor: "#059669" },
        }}
      >
        <Add />
      </Fab>

      {/* Confiscation Bottom Sheet */}
      <ConfiscationFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        token={token}
      />
    </Box>
  );
}
