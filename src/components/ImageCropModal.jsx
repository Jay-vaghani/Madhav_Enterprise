import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import imageCompression from "browser-image-compression";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Slider,
  CircularProgress,
} from "@mui/material";
import { CropOutlined, ZoomInOutlined } from "@mui/icons-material";

export default function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onComplete,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = useCallback(async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setProcessing(true);

    try {
      // Step 1: pixel-accurate crop → JPEG blob via canvas
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Step 2: compress with browser-image-compression → WebP ≤100 KB, max 800px
      const response = await fetch(croppedBase64);
      const blob = await response.blob();
      const file = new File([blob], "crop.jpg", { type: blob.type });

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.1,          // 100 KB ceiling
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.82,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        onComplete(reader.result);
        setProcessing(false);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Crop/compress failed:", err);
      setProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, onComplete]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            overflow: "hidden",
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 3,
          py: 2,
          borderBottom: "1px solid #E2E8F0",
          bgcolor: "#FAFBFC",
        }}
      >
        <CropOutlined sx={{ fontSize: 20, color: "#2563EB" }} />
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "1rem",
            color: "#0F172A",
          }}
        >
          Crop Photo
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.78rem",
            color: "#94A3B8",
            marginLeft: "auto",
          }}
        >
          Drag & pinch to adjust
        </p>
      </Box>

      <DialogContent sx={{ p: 0, position: "relative", height: 400 }}>
        {imageSrc && (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: "#0F172A" },
            }}
          />
        )}
      </DialogContent>

      {/* Zoom slider */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderTop: "1px solid #E2E8F0",
          bgcolor: "#FAFBFC",
        }}
      >
        <ZoomInOutlined sx={{ fontSize: 20, color: "#64748B" }} />
        <Slider
          value={zoom}
          min={1}
          max={6}
          step={0.025}
          onChange={(_, z) => setZoom(z)}
          sx={{
            color: "#2563EB",
            "& .MuiSlider-thumb": { width: 16, height: 16 },
          }}
        />
      </Box>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #E2E8F0",
          bgcolor: "#FAFBFC",
        }}
      >
        <Button
          onClick={onClose}
          disabled={processing}
          sx={{
            borderRadius: "10px",
            color: "#64748B",
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleDone}
          disabled={processing}
          sx={{
            borderRadius: "10px",
            fontWeight: 700,
            textTransform: "none",
            bgcolor: "#2563EB",
            px: 3,
            "&:hover": { bgcolor: "#1D4ED8" },
          }}
        >
          {processing ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} sx={{ color: "white" }} />
              <span style={{ fontSize: "0.82rem" }}>Compressing…</span>
            </Box>
          ) : (
            "Apply & Compress"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Helper: extract cropped area from canvas ────────────────────
function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );

      // Output as JPEG with high quality for student form, WEBP for admin approval
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.92,
      );
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}
