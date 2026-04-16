import React, { useState } from "react";
import { Box, ThemeProvider, CssBaseline } from "@mui/material";
import Grid from "@mui/material/Grid";
import { theme } from "../../../theme/theme";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopBar from "../components/AdminTopBar";
import PendingStudentsPage from "../pages/PendingStudentsPage";

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("pending");

  const renderPage = () => {
    switch (activePage) {
      case "pending":
        return <PendingStudentsPage />;
      case "approved":
        // Placeholder — build later
        return (
          <Box sx={{ p: 4 }}>
            <h2 style={{ color: "#0F172A", fontWeight: 700 }}>
              Approved Students
            </h2>
            <p style={{ color: "#64748B" }}>
              This page will be built in a future update.
            </p>
          </Box>
        );
      case "reports":
        // Placeholder — build later
        return (
          <Box sx={{ p: 4 }}>
            <h2 style={{ color: "#0F172A", fontWeight: 700 }}>Reports</h2>
            <p style={{ color: "#64748B" }}>
              This page will be built in a future update.
            </p>
          </Box>
        );
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
          {/* Sidebar */}
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
                }}
              >
                {renderPage()}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}
