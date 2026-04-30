import React, { useState } from "react";
import {
  Box,
  ThemeProvider,
  CssBaseline,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  PendingActionsOutlined,
  PeopleAltOutlined,
  BarChartOutlined,
  MoneyOffOutlined,
  DoNotDisturbAltOutlined,
  ConfirmationNumberOutlined,
} from "@mui/icons-material";
import { theme } from "../../../theme/theme";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopBar from "../components/AdminTopBar";
import PendingStudentsPage from "../pages/PendingStudentsPage";
import ReportsPage from "../pages/ReportsPage";
import ApprovedStudentsPage from "../pages/ApprovedStudentsPage";
import RejectedStudentsPage from "../pages/RejectedStudentsPage";
import CancellationPage from "../pages/CancellationPage";
import TemporaryPassesPage from "../pages/TemporaryPassesPage";
import StaffManagementPage from "../pages/StaffManagementPage";
import SettingsPage from "../pages/SettingsPage";

const NAV_ITEMS = [
  { id: "pending", label: "Pending", icon: <PendingActionsOutlined /> },
  { id: "approved", label: "Approved", icon: <PeopleAltOutlined /> },
  { id: "rejected", label: "Rejected", icon: <DoNotDisturbAltOutlined /> },
  { id: "temporary_passes", label: "Passes", icon: <ConfirmationNumberOutlined /> },
  { id: "cancellation", label: "Refund", icon: <MoneyOffOutlined /> },
  { id: "reports", label: "Reports", icon: <BarChartOutlined /> },
];

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("pending");

  const renderPage = () => {
    switch (activePage) {
      case "pending":
        return <PendingStudentsPage />;
      case "approved":
        return <ApprovedStudentsPage />;
      case "rejected":
        return <RejectedStudentsPage />;
      case "reports":
        return <ReportsPage />;
      case "cancellation":
        return <CancellationPage />;
      case "temporary_passes":
        return <TemporaryPassesPage />;
      case "staff_management":
        return <StaffManagementPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <PendingStudentsPage />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#F1F5F9",
          fontFamily: '"Inter", "Roboto", sans-serif',
          overflow: "hidden",
        }}
      >
        <Grid container wrap="nowrap" sx={{ flex: 1, minHeight: 0 }}>
          {/* Sidebar - Desktop Only */}
          <Grid
            size="auto"
            sx={{
              height: "100vh",
              display: { xs: "none", lg: "flex" },
              flexShrink: 0,
            }}
          >
            <AdminSidebar
              activePage={activePage}
              onPageChange={setActivePage}
            />
          </Grid>

          {/* Main content area */}
          <Grid size="grow" sx={{ minWidth: 0, height: "100vh" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {/* Top Bar */}
              <AdminTopBar />

              {/* Page Content */}
              <Box
                component="main"
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: { xs: 2, sm: 3, lg: 4 },
                  pb: { xs: 10, lg: 4 }, // Add padding bottom on mobile for bottom nav
                }}
              >
                {renderPage()}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Mobile Bottom Navigation */}
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: { xs: "block", lg: "none" },
            borderRadius: "12px 12px 0 0",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            background: "#ffffff57",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            zIndex: 1000,
          }}
          elevation={0}
        >
          <BottomNavigation
            value={activePage}
            onChange={(event, newValue) => {
              setActivePage(newValue);
            }}
            showLabels
            sx={{
              height: 72,
              background: "transparent",
              display: "flex",
              justifyContent: { xs: "flex-start", sm: "center" },
              overflowX: "auto",
              whiteSpace: "nowrap",
              scrollbarWidth: "none", // Firefox
              "&::-webkit-scrollbar": { display: "none" }, // Chrome/Safari
              "& .MuiBottomNavigationAction-root": {
                color: "#64748B",
                minWidth: { xs: 80, sm: 120 },
                flexShrink: 0,
                padding: "12px 0",
              },
              "& .Mui-selected": {
                color: "#2563EB",
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  transition: "all 0.2s",
                },
                "& .MuiSvgIcon-root": {
                  transform: "scale(1.1)",
                  transition: "all 0.2s",
                },
              },
            }}
          >
            {NAV_ITEMS.map((item) => (
              <BottomNavigationAction
                key={item.id}
                label={item.label}
                value={item.id}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
