import { Card, CardContent, Typography } from "@mui/material";

export default function TipCard({
  title = "Today's Tip",
  text = "Did you know that by registering for Selective Service, you may qualify for student aid? 🧠",
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        bgcolor: "#f7f9fb",
        boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <CardContent sx={{ py: 2.25 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
          {text}
        </Typography>
      </CardContent>
    </Card>
  );
}
