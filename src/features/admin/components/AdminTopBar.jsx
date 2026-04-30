import React from "react";
import {
  Box,
  Avatar,
  IconButton,
  Badge,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  SearchOutlined,
  NotificationsNoneOutlined,
  HelpOutlineOutlined,
  LogoutOutlined,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminTopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const roleLabel = user?.role === "admin" ? "Super Administrator" : "Manager";

  return (
    <Box
      sx={{
        height: 64,
        px: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "end",
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        gap: 2,
      }}
    >
      {/* User profile */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.2,
          ml: 1,
          pl: 2,
          borderLeft: "1px solid #E2E8F0",
        }}
      >
        <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#0F172A",
            }}
          >
            {user?.fullName || "Admin User"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.65rem",
              fontWeight: 600,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {roleLabel}
          </p>
        </Box>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: "#2563EB",
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          {(user?.fullName || "A").charAt(0).toUpperCase()}
        </Avatar>
        <IconButton 
          onClick={handleLogout}
          size="small"
          sx={{ 
            color: "#EF4444",
            bgcolor: "#FEF2F2",
            "&:hover": { bgcolor: "#FEE2E2" },
            borderRadius: "10px",
            ml: 1
          }}
        >
          <LogoutOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
