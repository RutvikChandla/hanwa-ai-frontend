
import { useEffect, useRef, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SendIcon from "@mui/icons-material/Send";
import BarChartIcon from "@mui/icons-material/BarChart";
import AddIcon from "@mui/icons-material/Add";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";

import { sendChatMessage, clearSession } from "../api/chat";
import DonutScore from "../components/DonutScore";

/* ---------- Defaults ---------- */
const INTRO_OPTIONS = [
  {
    key: "analyze",
    label: "Analyze my last exam",
    icon: <BarChartIcon fontSize="small" />,
  },
  { key: "improve", label: "💰 How can I improve my scores?" },
  { key: "how_am_i", label: "🤔 How am I doing now?" },
  { key: "similar_qs", label: "🧠 Come up with similar questions" },
];
const FOLLOWUP_OPTIONS = [
  { key: "mistakes", label: "Where did I make the most mistakes?" },
  { key: "resources", label: "Are there any resources I can use?" },
];

/* ---------- pie metric → DonutScore data + center label ---------- */
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
  return { data, centerLabel, summary: metric.summary || "" };
}

/* ---------- suggestions -> quick reply options ---------- */
function suggestionsToOptions(suggestions) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null;
  return suggestions.map((s, i) => ({ key: `sugg-${i}`, label: s }));
}

export default function StudyBotMUIEditable() {
  const [messages, setMessages] = useState(() => [
    { id: "card", role: "system", type: "card" },
    { id: "g1", role: "bot", text: "Hey Suzy!" },
    { id: "g2", role: "bot", text: "Well done on that last exam!" },
    {
      id: "g3",
      role: "bot",
      text: "You scored a 1,200 which is a marked improvement but I think there's still room to grow.",
    },
    { id: "g4", role: "bot", text: "You got this! 😉" },
  ]);
  const [phase, setPhase] = useState("intro");
  const [input, setInput] = useState("");
  const [outbox, setOutbox] = useState([]);
  const [sending, setSending] = useState(false);

  // NEW: state for current quick-reply options (starts with defaults)
  const [options, setOptions] = useState(INTRO_OPTIONS);

  // Scroll management
  const scrollAreaRef = useRef(null);
  const bottomRef = useRef(null);
  const footerRef = useRef(null);
  const [footerH, setFooterH] = useState(116);
  const [autoStick, setAutoStick] = useState(true);
  const navigate = useNavigate();

  // footer height watcher
  useEffect(() => {
    if (!footerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setFooterH(e.contentRect.height);
    });
    ro.observe(footerRef.current);
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - (el.scrollTop + el.clientHeight);
    setAutoStick(distanceFromBottom < 64);
  };

  useEffect(() => {
    if (!autoStick) return;
    const el = bottomRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "end", behavior: "smooth" });
      });
    });
  }, [messages.length, autoStick]);

  /* ---------- typing helpers ---------- */
  function showTyping() {
    const id = uuid();
    setMessages((m) => [...m, { id, role: "bot", typing: true }]);
    setAutoStick(true);
    return id;
  }
  function replaceTyping(id, text) {
    setMessages((m) => m.filter((msg) => msg.id !== id));
    setMessages((m) => [...m, { id: uuid(), role: "bot", text }]);
  }
  function removeTyping(id) {
    setMessages((m) => m.filter((msg) => msg.id !== id));
  }
  function appendBotText(text) {
    setMessages((m) => [...m, { id: uuid(), role: "bot", text }]);
  }

  /* ---------- append pie if present, and update suggestions ---------- */
  function applySuggestionsIfAny(payload) {
    const opts = suggestionsToOptions(payload?.suggestions);
    setOptions(opts || INTRO_OPTIONS); // fallback to defaults if none
  }

  function appendPieIfAny(payload) {
    const metric =
      payload?.metrics?.find(
        (m) => m && (m.type === "pie" || m.type === "donut")
      ) || null;
    if (!metric) return;
    const t = pieMetricToDonutData(metric);
    if (!t) return;
    setMessages((m) => [
      ...m,
      {
        id: uuid(),
        role: "bot",
        type: "pie",
        donutData: t.data,
        centerLabel: t.centerLabel,
        summary: t.summary,
      },
    ]);
  }

  /* ---------- helpers ---------- */
  const appendUser = (text) => {
    if (!text) return;
    setAutoStick(true);
    setMessages((m) => [...m, { id: uuid(), role: "user", text }]);
  };

//   function saveBarMetricIfAny(payload) {
//   const metric = payload?.metrics?.find((m) => m && m.type === "bar");
//   if (!metric) return;
//   try {
//     localStorage.setItem("lastBarMetric", JSON.stringify(metric));
//   } catch {}
// }
function saveBarMetricIfAny(payload) {
  const bars = (payload?.metrics || []).filter(m => m?.type === "bar");
  if (!bars.length) return;
  try {
    localStorage.setItem("lastBarMetrics", JSON.stringify(bars));
  } catch {}
}


//   async function callApiAndAppend(prompt) {
//     setOutbox((q) => [...q, { id: uuid(), prompt, ts: Date.now() }]);
//     try {
//       const payload = await sendChatMessage(prompt); // { reply, suggestions?, metrics? ... }
//       appendBotText(String(payload?.reply || "").trim());
//       appendPieIfAny(payload);
//       applySuggestionsIfAny(payload); // <-- update quick replies from suggestions
//     } catch (err) {
//       setMessages((m) => [
//         ...m,
//         {
//           id: uuid(),
//           role: "bot",
//           text: "Sorry, I couldn't reach the server.",
//         },
//       ]);
//       console.error("chat api error:", err);
//     }
//   }

  function savePieMetricIfAny(payload) {
    const metric = payload?.metrics?.find(
      (m) => m && (m.type === "pie" || m.type === "donut")
    );
    if (!metric) return;
    try {
      localStorage.setItem("lastPieMetric", JSON.stringify(metric));
    } catch {}
  }

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || sending) return;

    appendUser(prompt);
    setInput("");
    setSending(true);
    setAutoStick(true);

    const tId = showTyping();

    try {
      const payload = await sendChatMessage(prompt);
      replaceTyping(tId, String(payload?.reply || "").trim());
      appendPieIfAny(payload);
      savePieMetricIfAny(payload);
      saveBarMetricIfAny(payload);
      applySuggestionsIfAny(payload); // <-- update quick replies
    } catch (err) {
      removeTyping(tId);
      setMessages((m) => [
        ...m,
        {
          id: uuid(),
          role: "bot",
          text: "Sorry, I couldn't reach the server.",
        },
      ]);
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  /* ---------- choose quick reply ---------- */
  const handleChoose = async (opt) => {
    const label =
      typeof opt.label === "string" ? opt.label : opt.labelString ?? "";
    if (!label || sending) return;

    appendUser(label);

    const tId = showTyping();
    try {
      const payload = await sendChatMessage(label);
      replaceTyping(tId, String(payload?.reply || "").trim());
      appendPieIfAny(payload);
        savePieMetricIfAny(payload);
        saveBarMetricIfAny(payload);
      applySuggestionsIfAny(payload); // <-- update quick replies
    } catch (err) {
      removeTyping(tId);
      setMessages((m) => [
        ...m,
        {
          id: uuid(),
          role: "bot",
          text: "Sorry, I couldn't reach the server.",
        },
      ]);
    }

    if (opt.key === "analyze") setPhase("analyzeFollowups");

    // If you don't need to persist again, you can skip this extra call
    // setSending(true);
    // await callApiAndAppend(label);
    // setSending(false);
  };

  /* ---------- new chat ---------- */
  const handleNewChat = () => {
    clearSession();
    setMessages([
      { id: "card", role: "system", type: "card" },
      { id: "g1", role: "bot", text: "Hey Suzy!" },
      { id: "g2", role: "bot", text: "Well done on that last exam!" },
      {
        id: "g3",
        role: "bot",
        text: "You scored a 1,200 which is a marked improvement but I think there's still room to grow.",
      },
      { id: "g4", role: "bot", text: "You got this! 😉" },
    ]);
    setPhase("intro");
    setInput("");
    setOutbox([]);
    setOptions(INTRO_OPTIONS); // <-- reset to defaults
    setAutoStick(true);
  };

  /* ---------- UI ---------- */
  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Toolbar sx={{ mx: "auto", width: "100%" }}>
          <IconButton
            edge="start"
            size="small"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, ml: 1 }}>
            StudyBot
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="small"
            onClick={handleNewChat}
            sx={{
              mr: 1,
              bgcolor: "text.primary",
              color: "background.paper",
              "&:hover": { bgcolor: "text.secondary" },
              width: 32,
              height: 32,
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container
        sx={{ maxWidth: 480, px: 0, py: 0, height: `calc(100vh - 56px)` }}
        disableGutters
      >
        <Box
          ref={scrollAreaRef}
          onScroll={onScroll}
          sx={{
            height: `calc(100vh - 56px - ${footerH}px)`,
            overflowY: "auto",
            px: 2,
            pt: 2,
            pb: 1,
            overscrollBehavior: "contain",
          }}
        >

          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {messages
              .filter((m) => m.role !== "system")
              .map((m) => {
                if (!m.type || m.type === "text") {
                  return (
                    <MessageBubble
                      key={m.id}
                      role={m.role}
                      text={m.text}
                      typing={m.typing}
                    />
                  );
                }
                if (m.type === "pie" || m.type === "donut") {
                  return (
                    <Box
                      key={m.id}
                      sx={{ display: "flex", justifyContent: "flex-start" }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          bgcolor: "#f3f4f6",
                          color: "text.primary",
                          borderRadius: 3,
                          borderBottomLeftRadius: 6,
                          p: 1.25,
                          maxWidth: "100%",
                        }}
                      >
                        <DonutScore
                          data={m.donutData}
                          centerLabel={m.centerLabel}
                          size={220}
                          thickness={20}
                          responsive
                        />
                        {m.summary ? (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              mt: 1,
                              color: "text.secondary",
                            }}
                          >
                            {m.summary}
                          </Typography>
                        ) : null}
                      </Paper>
                    </Box>
                  );
                }
                return null;
              })}
          </Stack>

          <Box sx={{ height: footerH }} />
          <div ref={bottomRef} style={{ height: 1 }} />
        </Box>

        <Box
          ref={footerRef}
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Container maxWidth="sm" sx={{ py: 1.25 }}>
            <Stack spacing={1}>
              {/* Quick replies (now dynamic) */}
              <Stack spacing={1}>
                {options.map((o) => (
                  <Button
                    key={o.key}
                    onClick={() => handleChoose(o)}
                    fullWidth
                    startIcon={o.icon || null}
                    variant="outlined"
                    sx={{
                      justifyContent: "flex-start",
                      borderRadius: 99,
                      textTransform: "none",
                      fontSize: 15,
                      color: "text.primary",
                      borderColor: "divider",
                      bgcolor: "#f5f5f5",
                      "&:hover": { bgcolor: "#eee", borderColor: "divider" },
                      px: 2,
                      py: 1,
                    }}
                  >
                    {o.label}
                  </Button>
                ))}
              </Stack>

              {/* Input */}
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <TextField
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything :)"
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 500 }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
                />
                <IconButton
                  type="submit"
                  disabled={sending || !input.trim()}
                  sx={{
                    bgcolor: "text.primary",
                    color: "background.paper",
                    "&:hover": { bgcolor: "text.primary" },
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </Box>
            </Stack>
          </Container>
        </Box>
      </Container>
    </Box>
  );
}

/* ---------- UI pieces ---------- */
function MessageBubble({ role, text, typing }) {
  const isUser = role === "user";
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: "85%",
          px: 1.75,
          py: 1.25,
          borderRadius: 3,
          ...(isUser
            ? { bgcolor: "#111827", color: "#fff", borderBottomRightRadius: 6 }
            : {
                bgcolor: "#f3f4f6",
                color: "text.primary",
                borderBottomLeftRadius: 6,
              }),
        }}
      >
        {typing ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              "@keyframes blink": {
                "0%": { opacity: 0.2 },
                "20%": { opacity: 1 },
                "100%": { opacity: 0.2 },
              },
              "& .dot": {
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "text.secondary",
                animation: "blink 1.4s infinite both",
              },
              "& .dot:nth-of-type(2)": { animationDelay: "0.2s" },
              "& .dot:nth-of-type(3)": { animationDelay: "0.4s" },
            }}
          >
            <Box className="dot" />
            <Box className="dot" />
            <Box className="dot" />
          </Box>
        ) : (
          <Typography
            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.4, fontSize: 15 }}
          >
            {text}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}


function LabelProgress({ label, value, max, boldValue }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: boldValue ? 700 : 400 }}
        >
          {value.toLocaleString()} / {max.toLocaleString()}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ height: 8, borderRadius: 99, bgcolor: "#ececec", mt: 0.5 }}
      />
    </Box>
  );
}
