import React from "react";
import {
  Box, Card, CardContent, Container, Grid, List, ListItem,
  ListItemIcon, ListItemText, Typography, Divider
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import DonutScore from "../components/DonutScore";
import BudgetSummary from "../components/BudgetSummary";
import TipCard from "../components/TipCard";
import PillCTA from "../components/PillCTA";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const scoreData = [
    { label: "Reading", value: 240, color: "#111827" },
    { label: "Writing", value: 220, color: "#374151" },
    { label: "Reasoning", value: 140, color: "#6B7280" },
    { label: "Algebra", value: 100, color: "#9CA3AF" },
    { label: "Geometry", value: 100, color: "#D1D5DB" },
  ];
  const total = scoreData.reduce((s, d) => s + d.value, 0);

  const budgetTotal = 1576;
  const budgetLimit = 2000;
  const budgetSegments = [
    { label: "Savings", amount: 620, color: "#4B5563" },
    { label: "Food", amount: 540, color: "#9CA3AF" },
    { label: "Leisure", amount: 416, color: "#D1D5DB" },
  ];


  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <PillCTA label="Ask anything to Finny" onClick={() => navigate("/studybot")} />
      </Box>
      <BudgetSummary
        title="This Month's Budget"
        total={budgetTotal}
        limit={budgetLimit}
        segments={budgetSegments}
        currency="$"
      />
      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              {/* Force fixed size to be bulletproof on all layouts */}
              <DonutScore data={scoreData} centerLabel="#9" size={200} thickness={20} responsive={false} />
            </Grid>

            <Grid item xs={12} sm={7}>
              <List dense disablePadding>
                {scoreData.map((d) => {
                  const pct = total ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <ListItem key={d.label} disableGutters sx={{ py: 0.6 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <FiberManualRecordIcon sx={{ color: d.color, fontSize: 12 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Typography variant="body2">{d.label}</Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
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

function AnalysisItem({ text }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <CheckCircleIcon sx={{ color: "#16a34a" }} fontSize="small" />
      <Typography variant="body2">{text}</Typography>
    </Box>
  );
}
