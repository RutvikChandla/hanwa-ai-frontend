

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  LinearProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import DonutScore from "../components/DonutScore";
import TipCard from "../components/TipCard";
import PillCTA from "../components/PillCTA";
import { useNavigate } from "react-router-dom";

/* ---- helper: metric -> DonutScore data ---- */
function pieMetricToDonutData(metric) {
  if (
    !metric ||
    !Array.isArray(metric.labels) ||
    !Array.isArray(metric.datasets?.[0]?.data)
  ) {
    return null;
  }
  const bg = metric.datasets[0].backgroundColor;
  const data = metric.labels.map((label, i) => ({
    label,
    value: Number(metric.datasets[0].data[i] ?? 0),
    color: Array.isArray(bg) ? bg[i] : typeof bg === "string" ? bg : undefined,
  }));
  const total = data.reduce((s, d) => s + (isFinite(d.value) ? d.value : 0), 0);
  const centerLabel =
    total > 0
      ? `${total}${metric.unit ? ` ${metric.unit}` : ""}`
      : metric.title || "";
  return { data, centerLabel };
}

/* ---- helpers: convert your bar metrics → progress items ----
   We’ll build "sections" so multiple bar metrics can render in one card.
   Section shape: { title, unit?, items: [{ label, percent, leftText, rightText, color? }] }
*/
function toEducationHoursSection(metric) {
  // Expect two datasets: Completed Hours + Hours Remaining
  if (!metric?.labels?.length || metric.datasets?.length < 1) return null;

  const completedDs = metric.datasets.find((d) =>
    /completed/i.test(d.label || "")
  );
  const remainingDs = metric.datasets.find((d) =>
    /remain/i.test(d.label || "")
  );

  if (!completedDs || !Array.isArray(completedDs.data)) return null;

  const items = metric.labels.map((label, i) => {
    const completed = Number(completedDs.data[i] ?? 0);
    const remaining = Number(remainingDs?.data?.[i] ?? 0);
    const total = completed + (isFinite(remaining) ? remaining : 0);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const unit = metric.unit || "hours";
    const leftText = label; // e.g., "AWS Solutions Architect Exam"
    const rightText =
      total > 0
        ? `${completed} / ${total} ${unit} (${percent}%)`
        : `${completed} ${unit}`;
    // Prefer completed color if provided
    const color = Array.isArray(completedDs.backgroundColor)
      ? completedDs.backgroundColor[i]
      : typeof completedDs.backgroundColor === "string"
      ? completedDs.backgroundColor
      : undefined;

    return { label, percent, leftText, rightText, color };
  });

  return { title: metric.title || "Education Hours", unit: metric.unit, items };
}

function toGoalCompletionSection(metric) {
  // Expect a single dataset with percentages (0..100)
  if (!metric?.labels?.length || !metric?.datasets?.length) return null;
  const ds = metric.datasets[0];
  if (!Array.isArray(ds.data)) return null;

  const items = metric.labels.map((label, i) => {
    const pct = Number(ds.data[i] ?? 0);
    // const percent = Math.max(0, Math.min(100, Math.round(pct)));
    // const leftText = label;
    // const rightText = `${pct}%`;
    const display = isFinite(pct) ? Math.round(pct * 10) / 10 : 0; // one decimal for text
    const percent = Math.max(0, Math.min(100, Math.round(pct))); // whole number for bar fill
    const leftText = label;
    const rightText = `${display}%`;
    const color = Array.isArray(ds.backgroundColor)
      ? ds.backgroundColor[i]
      : typeof ds.backgroundColor === "string"
      ? ds.backgroundColor
      : undefined;
    return { label, percent, leftText, rightText, color };
  });

  return { title: metric.title || "Goal Completion", unit: metric.unit, items };
}

export default function Dashboard() {
  const navigate = useNavigate();

  // ----- fallback (your existing static donut data) -----
  const fallbackScoreData = [
    { label: "Reading", value: 240, color: "#111827" },
    { label: "Writing", value: 220, color: "#374151" },
    { label: "Reasoning", value: 140, color: "#6B7280" },
    { label: "Algebra", value: 100, color: "#9CA3AF" },
    { label: "Geometry", value: 100, color: "#D1D5DB" },
  ];

  // ----- load last pie & bar metrics from localStorage -----
  const [pieMetric, setPieMetric] = useState(null);
  // const [barMetric, setBarMetric] = useState(null);
  const [barMetric, setBarMetric] = useState([]);

  useEffect(() => {
    try {
      const rawPie = localStorage.getItem("lastPieMetric");
      if (rawPie) setPieMetric(JSON.parse(rawPie));
    } catch {}
    try {
      // const rawBar = localStorage.getItem("lastBarMetric");
      // if (rawBar) setBarMetric(JSON.parse(rawBar));
      const rawBars = localStorage.getItem("lastBarMetrics");
      if (rawBars) setBarMetric(JSON.parse(rawBars));
    } catch {}
  }, []);

  // Donut block (left side)
  const { scoreData, centerLabel } = useMemo(() => {
    const t = pieMetricToDonutData(pieMetric);
    if (t && Array.isArray(t.data) && t.data.length) {
      return { scoreData: t.data, centerLabel: t.centerLabel };
    }
    // fallback
    return { scoreData: fallbackScoreData, centerLabel: "#9" };
  }, [pieMetric]);

  const total = useMemo(
    () => scoreData.reduce((s, d) => s + (Number(d.value) || 0), 0),
    [scoreData]
  );

  // Build progress sections from the one saved bar metric (if it's one of your two)
  // const progressSections = useMemo(() => {
  //   if (!barMetric) return [];
  //   const sections = [];
  //   if (/education-hours|education/i.test(barMetric.id || "") || /hours/i.test(barMetric.title || "")) {
  //     const sec = toEducationHoursSection(barMetric);
  //     if (sec) sections.push(sec);
  //   } else if (/goal-progress|goal/i.test(barMetric.id || "") || /goal/i.test(barMetric.title || "")) {
  //     const sec = toGoalCompletionSection(barMetric);
  //     if (sec) sections.push(sec);
  //   } else {
  //     // Generic: if the dataset looks like % data, treat like goal completion; else treat like hours if there are 2 datasets
  //     if (barMetric.datasets?.length === 1) {
  //       const sec = toGoalCompletionSection(barMetric);
  //       if (sec) sections.push(sec);
  //     } else if (barMetric.datasets?.length >= 2) {
  //       const sec = toEducationHoursSection(barMetric);
  //       if (sec) sections.push(sec);
  //     }
  //   }
  //   return sections;
  // }, [barMetric]);
  const progressSections = useMemo(() => {
    const sections = [];
    for (const m of Array.isArray(barMetric) ? barMetric : []) {
      if (
        /education-hours|education/i.test(m.id || "") ||
        /hours/i.test(m.title || "")
      ) {
        const sec = toEducationHoursSection(m);
        if (sec) sections.push({ ...sec, summary: m.summary });
        continue;
      }
      if (
        /goal-progress|goal/i.test(m.id || "") ||
        /goal/i.test(m.title || "")
      ) {
        const sec = toGoalCompletionSection(m);
        if (sec) sections.push({ ...sec, summary: m.summary });
        continue;
      }
      // Fallback heuristics
      if (m.datasets?.length === 1) {
        const sec = toGoalCompletionSection(m);
        if (sec) sections.push({ ...sec, summary: m.summary });
      } else if (m.datasets?.length >= 2) {
        const sec = toEducationHoursSection(m);
        if (sec) sections.push({ ...sec, summary: m.summary });
      }
    }
    return sections;
  }, [barMetric]);

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <PillCTA
          label="Ask anything to Finny"
          onClick={() => navigate("/studybot")}
        />
      </Box>

      {/* === Progress card (replaces BudgetSummary) === */}
      <Card variant="outlined" sx={{ borderRadius: 4, mb: 2 }}>
        <CardContent>
          {progressSections.length > 0 ? (
            progressSections.map((sec) => (
              <Box key={sec.title} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {sec.title}
                  </Typography>
                  {sec.unit ? (
                    <Typography variant="caption" color="text.secondary">
                      Unit: {sec.unit}
                    </Typography>
                  ) : null}
                </Box>
                {sec.summary ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {sec.summary}
                  </Typography>
                ) : null}

                <Box sx={{ display: "grid", gap: 1.0 }}>
                  {sec.items.map((it) => (
                    <ProgressRow
                      key={`${sec.title}-${it.label}`}
                      left={it.leftText}
                      right={it.rightText}
                      percent={it.percent}
                      barColor={it.color}
                    />
                  ))}
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No progress data yet. Ask Finny for an analysis that returns bar
              metrics and they’ll appear here.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* === Donut card (unchanged UI) === */}
      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              {/* Fixed size keeps the chart stable on all layouts */}
              <DonutScore
                data={scoreData}
                centerLabel={centerLabel}
                size={200}
                thickness={20}
                responsive={false}
              />
            </Grid>

            <Grid item xs={12} sm={7}>
              <List dense disablePadding>
                {scoreData.map((d) => {
                  const pct = total
                    ? Math.round((Number(d.value) / total) * 100)
                    : 0;
                  return (
                    <ListItem key={d.label} disableGutters sx={{ py: 0.6 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <FiberManualRecordIcon
                          sx={{ color: d.color || "#9CA3AF", fontSize: 12 }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 2,
                            }}
                          >
                            <Typography variant="body2">{d.label}</Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary" }}
                            >
                              {d.value} ({pct}%)
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Analysis
          </Typography>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            <AnalysisItem text="Reading score improved 15% over the last 3 months" />
            <AnalysisItem text="Your expected range is 1,150 to 1,320" />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 2 }}>
        <TipCard />
      </Box>
    </Container>
  );
}

function ProgressRow({ left, right, percent, barColor }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2">{left}</Typography>
        <Typography variant="caption" color="text.secondary">
          {right}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={p}
        sx={{
          height: 10,
          borderRadius: 999,
          bgcolor: "#ececec",
          "& .MuiLinearProgress-bar": {
            backgroundColor: barColor || "#2563eb",
          },
        }}
      />
    </Box>
  );
}

function AnalysisItem({ text }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <CheckCircleIcon sx={{ color: "#16a34a" }} fontSize="small" />
      <Typography variant="body2">{text}</Typography>
    </Box>
  );
}
