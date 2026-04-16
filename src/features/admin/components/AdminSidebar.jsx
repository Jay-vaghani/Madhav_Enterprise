import React from "react";
import { Box, Avatar, Badge, IconButton, Tooltip } from "@mui/material";
import {
  PendingActionsOutlined,
  PeopleAltOutlined,
  BarChartOutlined,
  SettingsOutlined,
  HelpOutlineOutlined,
  AddRoadOutlined,
  LogoutOutlined,
  DirectionsBus,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  {
    id: "pending",
    label: "Pending Verifications",
    icon: PendingActionsOutlined,
    active: true,
  },
  {
    id: "approved",
    label: "Approved Students",
    icon: PeopleAltOutlined,
    active: false,
    disabled: true,
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChartOutlined,
    active: false,
    disabled: true,
  },
];

const BOTTOM_ITEMS = [
  { id: "routes", label: "Add & Edit Route", icon: AddRoadOutlined, accent: true, disabled: true },
  { id: "settings", label: "Settings", icon: SettingsOutlined, disabled: true },
  { id: "support", label: "Support", icon: HelpOutlineOutlined, disabled: true },
];

export default function AdminSidebar({ activePage, onPageChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <Box
      sx={{
        width: 240,
        height: "100%",
        bgcolor: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        fontFamily: '"Inter", "Roboto", sans-serif',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DirectionsBus sx={{ fontSize: 20, color: "#fff" }} />
          </Box>
          <Box>
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: 1.2,
              }}
            >
              Transport Portal
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.65rem",
                color: "#94A3B8",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              College Bus Management
            </p>
          </Box>
        </Box>
      </Box>

      {/* Nav Items */}
      <Box sx={{ flex: 1, px: 1.5, pt: 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <Box
              key={item.id}
              onClick={() => !item.disabled && onPageChange?.(item.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.3,
                mb: 0.5,
                borderRadius: "10px",
                cursor: item.disabled ? "default" : "pointer",
                opacity: item.disabled ? 0.45 : 1,
                bgcolor: isActive ? "#EFF6FF" : "transparent",
                borderLeft: isActive ? "3px solid #2563EB" : "3px solid transparent",
                transition: "all 0.15s ease",
                "&:hover": item.disabled
                  ? {}
                  : { bgcolor: isActive ? "#EFF6FF" : "#F8FAFC" },
              }}
            >
              <Icon
                sx={{
                  fontSize: 20,
                  color: isActive ? "#2563EB" : "#64748B",
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#2563EB" : "#334155",
                }}
              >
                {item.label}
              </p>
            </Box>
          );
        })}
      </Box>

      {/* Bottom Section */}
      <Box sx={{ px: 1.5, pb: 2 }}>
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.2,
                mb: 0.5,
                borderRadius: "10px",
                cursor: item.disabled ? "default" : "pointer",
                opacity: item.disabled ? 0.45 : 1,
                bgcolor: item.accent ? "#2563EB" : "transparent",
                "&:hover": item.disabled
                  ? {}
                  : { bgcolor: item.accent ? "#1D4ED8" : "#F8FAFC" },
                transition: "all 0.15s ease",
              }}
            >
              <Icon
                sx={{
                  fontSize: 20,
                  color: item.accent ? "#fff" : "#64748B",
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  fontWeight: item.accent ? 700 : 500,
                  color: item.accent ? "#fff" : "#334155",
                }}
              >
                {item.label}
              </p>
            </Box>
          );
        })}

        {/* Logout */}
        <Box
          onClick={handleLogout}
          sx={{
            mt: 1,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.2,
            borderRadius: "10px",
            cursor: "pointer",
            "&:hover": { bgcolor: "#FEF2F2" },
            transition: "all 0.15s ease",
          }}
        >
          <LogoutOutlined sx={{ fontSize: 20, color: "#EF4444" }} />
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "#EF4444",
            }}
          >
            Logout
          </p>
        </Box>
      </Box>
    </Box>
  );
}
