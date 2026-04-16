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
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

export default function AdminTopBar() {
  const { user } = useAuth();

  const roleLabel = user?.role === "admin" ? "Super Administrator" : "Manager";

  return (
    <Box
      sx={{
        height: 64,
        px: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        gap: 2,
      }}
    >
      {/* Search */}
      <TextField
        placeholder="Search student records..."
        variant="outlined"
        size="small"
        sx={{
          maxWidth: 420,
          flex: 1,
          "& .MuiOutlinedInput-root": {
            height: 40,
            borderRadius: "10px",
            bgcolor: "#F8FAFC",
            fontSize: "0.85rem",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#E2E8F0",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#CBD5E1",
            },
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 20, color: "#94A3B8" }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Right section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton size="small" sx={{ color: "#64748B" }}>
          <Badge
            variant="dot"
            sx={{
              "& .MuiBadge-badge": {
                bgcolor: "#2563EB",
                width: 8,
                height: 8,
                minWidth: 8,
              },
            }}
          >
            <NotificationsNoneOutlined sx={{ fontSize: 22 }} />
          </Badge>
        </IconButton>

        <IconButton size="small" sx={{ color: "#64748B" }}>
          <HelpOutlineOutlined sx={{ fontSize: 22 }} />
        </IconButton>

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
          <Box sx={{ textAlign: "right" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              {user?.username || "Admin User"}
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
            {(user?.username || "A").charAt(0).toUpperCase()}
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
}
