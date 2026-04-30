import React, { useState } from "react";
import { Box, Tabs, Tab, Paper } from "@mui/material";
import { AddCardOutlined, ViewListOutlined } from "@mui/icons-material";
import GeneratePassTab from "../components/GeneratePassTab";
import ManagePassesTab from "../components/ManagePassesTab";

export default function TemporaryPassesPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header & Tabs */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              Temporary Passes
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.95rem" }}>
              Generate and manage short-term transport passes
            </p>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            bgcolor: "#fff",
            overflow: "hidden",
            display: "inline-block",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                minHeight: 48,
                textTransform: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#64748B",
                px: 3,
                "&.Mui-selected": { color: "#2563EB" },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#2563EB",
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              },
            }}
          >
            <Tab icon={<AddCardOutlined sx={{ mr: 1, fontSize: 20 }} />} iconPosition="start" label="Generate Pass" />
            <Tab icon={<ViewListOutlined sx={{ mr: 1, fontSize: 20 }} />} iconPosition="start" label="Manage Passes" />
          </Tabs>
        </Paper>
      </Box>

      {/* Content Area */}
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === 0 && <GeneratePassTab />}
        {activeTab === 1 && <ManagePassesTab />}
      </Box>
    </Box>
  );
}
