import * as React from "react";
import Button from "@mui/material/Button";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

/**
 * PillCTA – dark rounded CTA button
 * Props:
 *  - label: string
 *  - onClick: () => void
 */
export default function PillCTA({ label = "Ask anything to Finny", onClick }) {
  return (
    <Button
      onClick={onClick}
      fullWidth
       endIcon={<ArrowForwardIosRoundedIcon sx={{ fontSize: 16 }} />}
      sx={{
        maxWidth: 380,
        borderRadius: 999,
        textTransform: "none",
        justifyContent: "space-between",
        px: 2.25,
        py: 1.25,
        bgcolor: "#111827",
        color: "#fff",
        boxShadow: "0 8px 24px rgba(0,0,0,0.20)",
        "&:hover": { bgcolor: "#0e1420" },
      }}
    >
      {label}
    </Button>
  );
}
