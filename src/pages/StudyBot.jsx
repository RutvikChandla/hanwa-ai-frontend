// StudyBotMUIEditableScroll.jsx
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
import { sendChatMessage, clearSession } from '../api/chat';
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";

// ----- Component -----
export default function StudyBotMUIEditable() {
    const [messages, setMessages] = useState(() => [
        { id: "card", role: "system", type: "card" },
        { id: "g1", role: "bot", text: "Hey Suzy!" },
        { id: "g2", role: "bot", text: "Well done on that last exam!" },
        {
            id: "g3",
            role: "bot",
            text:
                "You scored a 1,200 which is a marked improvement but I think there's still room to grow.",
        },
        { id: "g4", role: "bot", text: "You got this! 😉" },
    ]);
    const [phase, setPhase] = useState("intro"); // intro | analyzeFollowups
    const [input, setInput] = useState("");
    const [outbox, setOutbox] = useState([]); // store prompts you send to API later
    const [sending, setSending] = useState(false);

    // Scroll management refs/state
    const scrollAreaRef = useRef(null);
    const bottomRef = useRef(null);
    const footerRef = useRef(null);
    const [footerH, setFooterH] = useState(116);
    const [autoStick, setAutoStick] = useState(true); // only autoscroll if near bottom
    const navigate = useNavigate();

    // Measure footer height (handles different content / mobile keyboards)
    useEffect(() => {
        if (!footerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) setFooterH(e.contentRect.height);
        });
        ro.observe(footerRef.current);
        return () => ro.disconnect();
    }, []);

    // Track whether user is near bottom
    const onScroll = () => {
        const el = scrollAreaRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
        setAutoStick(distanceFromBottom < 64); // 64px threshold
    };

    // Stick to bottom when new messages arrive (after paint)
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


    // ---------- Quick reply handling ----------
    // const handleChoose = (opt) => {
    //     setAutoStick(true);
    //     appendUser(
    //         opt.labelString || (typeof opt.label === "string" ? opt.label : String(opt.label))
    //     );

    //     const push = (text) =>
    //         setMessages((m) => [...m, { id: uuid(), role: "bot", text }]);

    //     if (opt.key === "analyze") {
    //         setTimeout(() => {
    //             push("Looks like your math scores have the most room for growth.");
    //             setPhase("analyzeFollowups");
    //         }, 250);
    //     }
    //     if (opt.key === "improve") {
    //         setTimeout(
    //             () => push("Try 20 mins/day of mixed practice. I can suggest targeted drills if you'd like."),
    //             250
    //         );
    //     }
    //     if (opt.key === "how_am_i") {
    //         setTimeout(
    //             () => push("You're trending upward. Expected range 1150–1320 based on recent attempts."),
    //             250
    //         );
    //     }
    //     if (opt.key === "similar_qs") {
    //         setTimeout(
    //             () =>
    //                 push(
    //                     "Here are 3 practice prompts: (1) Analyze my last exam (2) Where did I make the most mistakes? (3) Are there any resources I can use?"
    //                 ),
    //             250
    //         );
    //     }
    //     if (opt.key === "mistakes") {
    //         setTimeout(
    //             () => push("Most misses were Algebra word problems and multi-step Geometry proofs."),
    //             250
    //         );
    //     }
    //     if (opt.key === "resources") {
    //         setTimeout(
    //             () =>
    //                 push("Try Khan Academy Algebra II Unit 3, and 2 sets from Official Guide p. 142–149."),
    //             250
    //         );
    //     }
    // };

    // --- Typing indicator helpers ---
    function showTyping() {
        const id = uuid();                         
        setMessages(m => [...m, { id, role: "bot", typing: true }]);
        setAutoStick(true);                            
        return id;
    }
    function replaceTyping(id, text) {
        // remove the typing bubble and append the real reply
        setMessages(m => m.filter(msg => msg.id !== id));
        setMessages(m => [...m, { id: uuid(), role: "bot", text }]);
    }
    function removeTyping(id) {
        setMessages(m => m.filter(msg => msg.id !== id));
    }

    const handleChoose = async (opt) => {
        // 1) Get a plain string from the option's label
        const label =
            typeof opt.label === "string"
                ? opt.label
                : opt.labelString ?? ""; // set labelString on options with JSX labels if needed

        if (!label || sending) return;   // prevent empty or double-send

        // 2) Show user bubble immediately and stick scroll to bottom
        setAutoStick(true);
        appendUser(label);

        const tId = showTyping();
        try {
            const reply = await sendChatMessage(text);
            replaceTyping(tId, String(reply || "").trim());
        } catch (err) {
            removeTyping(tId);
            setMessages(m => [...m, { id: uuid(), role: "bot", text: "Sorry, I couldn't reach the server." }]);
        }

        // 3) (Optional) if selecting "Analyze…" should reveal follow-ups
        if (opt.key === "analyze") {
            setPhase("analyzeFollowups");
        }

        // 4) Send to server and append bot reply
        try {
            setSending(true);
            await callApiAndAppend(label);   // <- this calls your POST /api/v1/chat/message and appends bot msg
        } finally {
            setSending(false);
        }
    };


    // ---------- Freeform send handling ----------
    const appendUser = (text) => {
        if (!text) return;
        setAutoStick(true);
        setMessages((m) => [...m, { id: uuid(), role: "user", text }]);
    };

    // const mockApiCall = async (prompt) => {
    //     setOutbox((q) => [...q, { id: uuid(), prompt, ts: Date.now() }]);
    //     await new Promise((r) => setTimeout(r, 400)); // fake latency
    //     return `You said: "${prompt}". (This is a placeholder reply.)`;
    // };


    async function callApiAndAppend(prompt) {
        // record locally
        setOutbox(q => [...q, { id: uuid(), prompt, ts: Date.now() }]);

        try {
            const reply = await sendChatMessage(prompt);
            setMessages(m => [...m, { id: uuid(), role: "bot", text: String(reply || "").trim() }]);
        } catch (err) {
            setMessages(m => [...m, { id: uuid(), role: "bot", text: "Sorry, I couldn't reach the server." }]);
            console.error("chat api error:", err);
        }
    }
    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     const prompt = input.trim();
    //     if (!prompt || sending) return;

    //     appendUser(prompt);
    //     setInput("");
    //     setSending(true);

    //     try {
    //         const reply = await mockApiCall(prompt);
    //         setMessages((m) => [...m, { id: uuid(), role: "bot", text: reply }]);
    //     } finally {
    //         setSending(false);
    //     }
    // };

    // input submit
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
            const reply = await sendChatMessage(prompt);     // your real API call
            replaceTyping(tId, String(reply || "").trim());  // HIDE typing -> add reply
        } catch (err) {
            removeTyping(tId);                               // HIDE typing on error
            setMessages(m => [...m, { id: uuid(), role: "bot", text: "Sorry, I couldn't reach the server." }]);
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    // Handle new chat button click
    const handleNewChat = () => {
        // Clear session from localStorage
        clearSession();

        // Reset messages to initial greeting
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

        // Reset phase and input
        setPhase("intro");
        setInput("");
        setOutbox([]);

        // Scroll to top
        setAutoStick(true);
    };

    const options = phase === "intro" ? INTRO_OPTIONS : FOLLOWUP_OPTIONS;

    return (
        <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
            {/* App Bar */}
            <AppBar
                position="sticky"
                elevation={0}
                color="transparent"
                sx={{ borderBottom: "1px solid", borderColor: "divider" }}
            >
                <Toolbar sx={{ mx: "auto", width: "100%" }}>
                    <IconButton edge="start" size="small">
                        <ArrowBackIosNewIcon fontSize="small" onClick={() => navigate("/dashboard")} />
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
                            height: 32
                        }}
                    >
                        <AddIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                        <MoreHorizIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Conversation + Footer container (full viewport minus appbar) */}
            <Container sx={{ maxWidth: 480, px: 0, py: 0, height: `calc(100vh - 56px)` }} disableGutters>
                {/* Scrollable conversation area */}
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
                    {/* Score card */}
                    <GoalCard />

                    {/* Messages */}
                    <Stack spacing={1.5} sx={{ mt: 2 }}>
                        {messages
                            .filter((m) => m.role !== "system")
                            .map((m) => (
                                <MessageBubble key={m.id} role={m.role} text={m.text} typing={m.typing} />
                            ))}
                    </Stack>

                    {/* Bottom sentinel to scrollIntoView */}
                    <Box sx={{ height: footerH }} />
                    <div ref={bottomRef} style={{ height: 1 }} />
                </Box>

                {/* Footer: quick replies + input (measured by ResizeObserver) */}
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
                            {/* Quick replies */}
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
                                    sx={{
                                        "& .MuiOutlinedInput-root": { borderRadius: 999 },
                                    }}
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

// ----- UI components -----
// function MessageBubble({ role, text }) {
//     const isUser = role === "user";
//     return (
//         <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
//             <Paper
//                 elevation={0}
//                 sx={{
//                     maxWidth: "85%",
//                     px: 1.75,
//                     py: 1.25,
//                     borderRadius: 3,
//                     ...(isUser
//                         ? { bgcolor: "#111827", color: "#fff", borderBottomRightRadius: 6 }
//                         : { bgcolor: "#f3f4f6", color: "text.primary", borderBottomLeftRadius: 6 }),
//                 }}
//             >
//                 <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.4, fontSize: 15 }}>
//                     {text}
//                 </Typography>
//             </Paper>
//         </Box>
//     );
// }

function MessageBubble({ role, text, typing }) {
  const isUser = role === "user";
  return (
    <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: "85%",
          px: 1.75,
          py: 1.25,
          borderRadius: 3,
          ...(isUser
            ? { bgcolor: "#111827", color: "#fff", borderBottomRightRadius: 6 }
            : { bgcolor: "#f3f4f6", color: "text.primary", borderBottomLeftRadius: 6 }),
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
                width: 6, height: 6, borderRadius: "50%", bgcolor: "text.secondary",
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
          <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.4, fontSize: 15 }}>
            {text}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}


function GoalCard() {
    return (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                        ABC Certification Preparation
                    </Typography>
                    <Button size="small" variant="text">
                        See more
                    </Button>
                </Box>
                <Stack spacing={1.2} sx={{ mt: 1.5 }}>
                    <LabelProgress label="Goals" value={1200} max={1600} />
                    <LabelProgress label="Score" value={1200} max={1600} boldValue />
                </Stack>
            </CardContent>
        </Card>
    );
}

function LabelProgress({ label, value, max, boldValue }) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: boldValue ? 700 : 400 }}>
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

// ----- Static options -----
const INTRO_OPTIONS = [
    { key: "analyze", label: "Analyze my last exam", icon: <BarChartIcon fontSize="small" /> },
    { key: "improve", label: "💰 How can I improve my scores?" },
    { key: "how_am_i", label: "🤔 How am I doing now?" },
    { key: "similar_qs", label: "🧠 Come up with similar questions" },
];

const FOLLOWUP_OPTIONS = [
    { key: "mistakes", label: "Where did I make the most mistakes?" },
    { key: "resources", label: "Are there any resources I can use?" },
];
