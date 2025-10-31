import { Box, Chip } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/**
 * DonutScore – robust donut that always renders
 * Props:
 *  - data: [{ label, value, color? }]
 *  - centerLabel: string
 *  - size: number (px) fallback size if parent sizing is flaky (default 200)
 *  - thickness: number ring thickness (default 18)
 *  - responsive: boolean (default true). If false, uses fixed width/height.
 */
export default function DonutScore({
  data,
  centerLabel = "",
  size = 200,
  thickness = 18,
  responsive = true,
}) {
  const GREYS = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

  const Ring = (
    <PieChart width={size} height={size}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="label"
        innerRadius={size / 2 - thickness}
        outerRadius={size / 2}
        startAngle={90}
        endAngle={-270}
        isAnimationActive={false}
      >
        {data.map((d, i) => (
          <Cell key={d.label} fill={d.color || GREYS[i % GREYS.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{ borderRadius: 12 }}
        formatter={(val, name) => [`${val}`, name]}
      />
    </PieChart>
  );

  return (
    <Box sx={{ position: "relative", width: "100%", maxWidth: size, mx: "auto" }}>
      {responsive ? (
        <Box sx={{ width: "100%", height: size }}>
          <ResponsiveContainer width="100%" height="100%">
            {/* Recharts needs children that ignore external width/height;
               we pass a cloned PieChart with width/height ignored */}
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={(size / 2) - thickness}
                outerRadius={size / 2}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {data.map((d, i) => (
                  <Cell key={d.label} fill={d.color || GREYS[i % GREYS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        // Fallback fixed chart when parent sizing is unreliable
        <Box sx={{ width: size, height: size }}>{Ring}</Box>
      )}

      {/* Center label */}
      <Chip
        label={centerLabel}
        size="small"
        sx={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          fontWeight: 700,
          backgroundColor: "#f3f4f6",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}
