import React from "react";
import {
  Box,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  PendingActionsOutlined,
  PeopleAltOutlined,
  SettingsOutlined,
  LogoutOutlined,
  DirectionsBus,
  MoneyOffOutlined,
  DoNotDisturbAltOutlined,
  ConfirmationNumberOutlined,
  ManageAccountsOutlined,
  DirectionsBusOutlined,
  LocalGasStationOutlined,
  PersonOutlined,
  StackedBarChartOutlined,
  WarningAmber,
  DescriptionOutlined,
  BuildOutlined,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { isDivider: true, id: "div-0", label: "Students" },
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
  },
  {
    id: "confiscations",
    label: "Confiscations",
    icon: WarningAmber,
    active: false,
  },

  {
    id: "reports",
    label: "Reports",
    icon: StackedBarChartOutlined,
    active: false,
  },
  {
    id: "temporary_passes",
    label: "Temporary Passes",
    icon: ConfirmationNumberOutlined,
    active: false,
  },
  {
    id: "cancellation",
    label: "Cancellation & Refund",
    icon: MoneyOffOutlined,
    active: false,
  },
  { isDivider: true, id: "div-1", label: "Operations" },
  {
    id: "buses",
    label: "Bus Management",
    icon: DirectionsBusOutlined,
    active: false,
    adminOnly: true,
  },
  {
    id: "fuel",
    label: "Fuel Management",
    icon: LocalGasStationOutlined,
    active: false,
  },
  {
    id: "drivers",
    label: "Driver Management",
    icon: PersonOutlined,
    active: false,
  },
  {
    id: "bus_documents",
    label: "Bus Documents",
    icon: DescriptionOutlined,
    active: false,
    adminOnly: true,
  },
  {
    id: "bus_maintenance",
    label: "Bus Maintenance",
    icon: BuildOutlined,
    active: false,
    adminOnly: true,
  },
  { isDivider: true, id: "div-2", label: "Staff" },
  {
    id: "staff",
    label: "Staff Management",
    icon: ManageAccountsOutlined,
    active: false,
  },
  {
    id: "staff_analytics",
    label: "Staff Analytics",
    icon: StackedBarChartOutlined,
    active: false,
  },
  {
    id: "staff_settings",
    label: "Staff Settings",
    icon: SettingsOutlined,
    active: false,
    adminOnly: true,
  },
  { isDivider: true, id: "div-3", label: "System", adminOnly: true },
  {
    id: "settings",
    label: "Settings",
    icon: SettingsOutlined,
    active: false,
    adminOnly: true,
  },
];

export default function AdminSidebar({ activePage, onPageChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin", { replace: true });
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
      <Box sx={{ flex: 1, px: 1.5, pt: 1, overflowY: "auto" }}>
        {NAV_ITEMS.filter(
          (item) =>
            !item.adminOnly ||
            user?.role === "admin" ||
            user?.role === "superadmin",
        ).map((item) => {
          if (item.isDivider) {
            return (
              <Box key={item.id} sx={{ mt: 2.5, mb: 1, mx: 2 }}>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#94A3B8",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }
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
                borderLeft: isActive
                  ? "3px solid #2563EB"
                  : "3px solid transparent",
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
