// In-memory rate limit store: IP -> { count, resetAt }
const rateLimitStore = new Map();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }

  try {
    const { messages, modelOverride } = req.body;

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set");
      return res.status(500).json({ error: "API key not configured" });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: modelOverride === "large" ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant",
        messages: messages,
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const data = await groqRes.json();

    // Log full response for debugging
    console.log("Groq status:", groqRes.status);
    console.log("Groq response:", JSON.stringify(data));

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({ 
        error: data.error?.message || "Groq API error",
        details: data 
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Handler error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}