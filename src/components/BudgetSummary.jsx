import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
} from "@mui/material";

/**
 * BudgetSummary
 * Props:
 *  - title: string
 *  - total: number     (spent so far)
 *  - limit: number     (budget limit)
 *  - segments: Array<{ label: string, amount: number, color?: string }>
 *  - currency: string  (default "$")
 */
export default function BudgetSummary({
  title = "This Month's Budget",
  total = 1576,
  limit = 2000,
  segments = [],
  currency = "$",
}) {
  const normalized = useMemo(() => {
    const safeLimit = Math.max(1, limit); // avoid /0
    return segments.map((s) => ({
      ...s,
      pctOfLimit: Math.min(100, Math.max(0, (s.amount / safeLimit) * 100)),
    }));
  }, [segments, limit]);

  const remainingPct = Math.max(
    0,
    100 - normalized.reduce((acc, s) => acc + s.pctOfLimit, 0)
  );

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 4, mb: 2, overflow: "hidden" }}
      aria-label="budget summary"
    >
      <CardContent>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>

        {/* Amount */}
        <Typography sx={{ mt: 0.5 }}>
          <strong>
            {currency}
            {formatNumber(total)}
          </strong>{" "}
          <Typography component="span" color="text.secondary">
            / {currency}
            {formatNumber(limit)}
          </Typography>
        </Typography>

        {/* Segmented progress bar */}
        <Box
          sx={{
            mt: 1.5,
            height: 10,
            borderRadius: 999,
            bgcolor: "#eee",
            overflow: "hidden",
            display: "flex",
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Math.min(total, limit)}
        >
          {normalized.map((s, i) => (
            <Box
              key={s.label + i}
              sx={{
                width: `${s.pctOfLimit}%`,
                bgcolor: s.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                flexShrink: 0,
              }}
              title={`${s.label}: ${currency}${formatNumber(s.amount)}`}
            />
          ))}

          {/* remaining to limit, shown as very light grey to match screenshot */}
          {remainingPct > 0 && (
            <Box sx={{ width: `${remainingPct}%`, bgcolor: "#f3f4f6" }} />
          )}
        </Box>

        {/* Legend */}
        <Stack
          direction="row"
          spacing={3}
          alignItems="center"
          sx={{ mt: 1.5, flexWrap: "wrap" }}
        >
          {segments.map((s, i) => (
            <LegendItem
              key={s.label}
              label={s.label}
              color={s.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function LegendItem({ label, color }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: color,
        }}
      />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

const SEGMENT_COLORS = ["#4B5563", "#9CA3AF", "#D1D5DB"]; // dark → light greys

function formatNumber(n) {
  return new Intl.NumberFormat().format(n);
}
