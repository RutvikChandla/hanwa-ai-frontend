// --- Config ---
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api/v1";
const SESSION_URL = `${API_BASE}/chat/session`;
const CHAT_URL = `${API_BASE}/chat/message`;

const SESSION_KEY = "studybot_session_id";

// Get stored session ID from localStorage
function getSessionId() {
    return localStorage.getItem(SESSION_KEY) || null;
}

// Store session ID in localStorage
function setSessionId(sessionId) {
    localStorage.setItem(SESSION_KEY, sessionId);
}

// Get auth token
function getBearer() {
    return localStorage.getItem("auth_token") || "";
}

// Create new session via backend
export async function createSession() {
    const headers = { "Content-Type": "application/json" };
    const token = getBearer();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(SESSION_URL, {
        method: "POST",
        headers,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json().catch(() => ({}));
    const sessionId = data.data?.sessionId;

    if (sessionId) {
        setSessionId(sessionId);
    }

    return sessionId;
}

// Clear current session from localStorage
export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// Core call - sends message through backend which proxies to n8n
export async function sendChatMessage(message) {
    let sessionId = getSessionId();

    // If no session exists, create one first
    if (!sessionId) {
        sessionId = await createSession();
    }

    const headers = { "Content-Type": "application/json" };
    const token = getBearer();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(CHAT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, message }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json().catch(() => ({}));

    // Backend returns { success: true, data: { sessionId, reply, suggestions, metadata } }
    return data.data?.reply ?? data.reply ?? data.message ?? data.response ?? "";
}
