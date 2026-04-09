import React from "react";
import { Box, Card, CardContent, Button, useTheme } from "@mui/material";
import {
  CheckCircle,
  LocationOn,
  AccountBalanceWallet,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";

export default function SuccessPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        fontFamily: '"Inter", "Roboto", sans-serif',
      }}
    >
      <AppHeader />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 3, lg: 4 },
          overflowY: "auto",
        }}
      >
        <Card
          elevation={0}
          sx={{
            maxWidth: 600,
            width: "100%",
            borderRadius: "24px",
            border: "1px solid",
            borderColor: "grey.100",
            boxShadow: "0 10px 40px rgba(37,99,235,0.08)",
            overflow: "hidden",
            animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            "@keyframes slideUp": {
              "0%": { opacity: 0, transform: "translateY(40px) scale(0.98)" },
              "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
            },
          }}
        >
          <Box
            sx={{
              height: 140,
              background: "linear-gradient(135deg, #10B981 0%, #047857 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                bgcolor: "white",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(4,120,87,0.3)",
                position: "absolute",
                bottom: -40,
                animation:
                  "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both",
                "@keyframes popIn": {
                  "0%": { opacity: 0, transform: "scale(0.5)" },
                  "100%": { opacity: 1, transform: "scale(1)" },
                },
              }}
            >
              <CheckCircle sx={{ fontSize: 90, color: "#10B981" }} />
            </Box>
          </Box>

          <CardContent
            sx={{ pt: 8, pb: 4, px: { xs: 3, lg: 5 }, textAlign: "center" }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.5rem,4vw,2rem)",
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: 1.2,
              }}
            >
              Application Submitted!
            </h1>
            <p
              style={{
                margin: "12px 0 32px 0",
                fontSize: "1rem",
                color: "#64748B",
                lineHeight: 1.6,
              }}
            >
              Your transport registration profile has been successfully saved to
              our system.
            </p>

            <Box
              sx={{
                bgcolor: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "16px",
                p: 3,
                textAlign: "left",
                mb: 4,
              }}
            >
              <h2
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#1E3A8A",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Next Steps to Complete Registration
              </h2>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "12px",
                    bgcolor: "#DBEAFE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <LocationOn sx={{ color: "#2563EB", fontSize: 20 }} />
                </Box>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#0F172A",
                    }}
                  >
                    Visit the Transportation Office
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "0.85rem",
                      color: "#475569",
                      lineHeight: 1.5,
                    }}
                  >
                    Please visit the Transportation Office at KPGU.
                  </p>
                </div>
              </Box>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "12px",
                    bgcolor: "#DBEAFE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AccountBalanceWallet
                    sx={{ color: "#2563EB", fontSize: 20 }}
                  />
                </Box>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#0F172A",
                    }}
                  >
                    Pay Your Transport Fees
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "0.85rem",
                      color: "#475569",
                      lineHeight: 1.5,
                    }}
                  >
                    Pay Transportation fees and get your bus pass.
                  </p>
                </div>
              </Box>
            </Box>

            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                // optionally we could reset the form here
                navigate("/");
              }}
              sx={{
                height: 48,
                px: 4,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                fontWeight: 700,
                fontSize: "0.95rem",
                letterSpacing: "0.02em",
                "&:hover": {
                  boxShadow: "0 8px 25px rgba(37,99,235,0.35)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s",
              }}
            >
              Start New Registration
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
