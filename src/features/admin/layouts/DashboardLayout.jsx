import React, { useState, useEffect } from "react";
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
  DirectionsBusOutlined,
  LocalGasStationOutlined,
  PersonOutlined,
  WarningAmber,
  DescriptionOutlined,
  BuildOutlined,
} from "@mui/icons-material";
import { theme } from "../../../theme/theme";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopBar from "../components/AdminTopBar";
import PendingStudentsPage from "../pages/PendingStudentsPage";
import ReportsPage from "../pages/ReportsPage";
import ApprovedStudentsPage from "../pages/ApprovedStudentsPage";

import CancellationPage from "../pages/CancellationPage";
import TemporaryPassesPage from "../pages/TemporaryPassesPage";
import SettingsPage from "../pages/SettingsPage";
import StaffSettingsPage from "../pages/StaffSettingsPage";
import BusManagementPage from "../../fleet/pages/BusManagementPage";
import FuelManagementPage from "../../fleet/pages/FuelManagementPage";
import DriverManagementPage from "../../fleet/pages/DriverManagementPage";
import StaffManagementPage from "../../staff/pages/StaffManagementPage";
import StaffPaymentsPage from "../../staff/pages/StaffPaymentsPage";
import StaffAnalyticsPage from "../../staff/pages/StaffAnalyticsPage";
import ConfiscationsPage from "../pages/ConfiscationsPage";
import BusDocumentsPage from "../../fleet/pages/BusDocumentsPage";
import BusMaintenancePage from "../../fleet/pages/BusMaintenancePage";

const NAV_ITEMS = [
  { id: "pending", label: "Pending", icon: <PendingActionsOutlined /> },
  { id: "approved", label: "Approved", icon: <PeopleAltOutlined /> },
  { id: "reports", label: "Reports", icon: <BarChartOutlined /> },
  { id: "confiscations", label: "Confiscations", icon: <WarningAmber /> },
  {
    id: "temporary_passes",
    label: "Passes",
    icon: <ConfirmationNumberOutlined />,
  },
  { id: "cancellation", label: "Refund", icon: <MoneyOffOutlined /> },
  { id: "buses",          label: "Buses",       icon: <DirectionsBusOutlined /> },
  { id: "fuel",           label: "Fuel",        icon: <LocalGasStationOutlined /> },
  { id: "drivers",        label: "Drivers",     icon: <PersonOutlined /> },
  { id: "bus_documents",  label: "Docs",        icon: <DescriptionOutlined /> },
  { id: "bus_maintenance",label: "Maintenance", icon: <BuildOutlined /> },
  { id: "staff", label: "Staff", icon: <PeopleAltOutlined /> },
  { id: "staff_analytics", label: "Staff Stats", icon: <BarChartOutlined /> },
];

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("pending");

  // SEO: prevent admin pages from being indexed by search engines
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    meta.setAttribute("data-admin-noindex", "true");
    document.head.appendChild(meta);
    return () => {
      document.head.querySelector('meta[data-admin-noindex="true"]')?.remove();
    };
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "pending":
        return <PendingStudentsPage />;
      case "approved":
        return <ApprovedStudentsPage />;
      case "confiscations":
        return <ConfiscationsPage />;

      case "reports":
        return <ReportsPage />;
      case "cancellation":
        return <CancellationPage />;
      case "temporary_passes":
        return <TemporaryPassesPage />;
      case "settings":
        return <SettingsPage />;
      case "staff_settings":
        return <StaffSettingsPage />;
      case "buses":
        return <BusManagementPage />;
      case "fuel":
        return <FuelManagementPage />;
      case "drivers":
        return <DriverManagementPage />;
      case "bus_documents":
        return <BusDocumentsPage />;
      case "bus_maintenance":
        return <BusMaintenancePage />;
      case "staff":
        return <StaffManagementPage />;
      case "staff_analytics":
        return <StaffAnalyticsPage />;
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
