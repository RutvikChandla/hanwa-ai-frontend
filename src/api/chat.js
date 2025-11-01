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


// export async function sendChatMessage(message) {
//   let sessionId = getSessionId();
//   if (!sessionId) {
//     sessionId = await createSession();
//   }

//   const headers = { "Content-Type": "application/json" };
//   const token = getBearer?.();
//   if (token) headers["Authorization"] = `Bearer ${token}`;

//   const res = await fetch(CHAT_URL, {
//     method: "POST",
//     headers,
//     body: JSON.stringify({ sessionId, message }),
//     credentials: "include",
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => "");
//     throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
//   }

//   // Your API sometimes responds as { success, data: {...} } and sometimes just {...}
//   const json = await res.json().catch(() => ({}));
//   const payload = json?.data ?? json;

//   // Normalize: always return an object with { reply, suggestions?, metrics?, metadata? }
//   return {
//     reply: payload.reply ?? payload.message ?? payload.response ?? "",
//     suggestions: payload.suggestions ?? [],
//     metrics: Array.isArray(payload.metrics) ? payload.metrics : null,
//     metadata: payload.metadata ?? null,
//     sessionId: payload.sessionId ?? sessionId,
//   };
// }
export async function sendChatMessage(message) {
  let sessionId = getSessionId();
  if (!sessionId) {
    sessionId = await createSession();
  }

  const headers = { "Content-Type": "application/json" };
  const token = getBearer?.();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ sessionId, message }),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  const json = await res.json().catch(() => ({}));
  const payload = json?.data ?? json;

  return {
    reply: payload.reply ?? payload.message ?? payload.response ?? "",
    suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
    metrics: Array.isArray(payload.metrics) ? payload.metrics : null,
    metadata: payload.metadata ?? null,
    sessionId: payload.sessionId ?? sessionId,
  };
}
