// ============================================================
// FILE: api/chat.js
// PURPOSE: Serverless function — proxies requests from the
//          frontend to Groq API. Keeps API key secret by
//          running server-side. Never exposes key to browser.
// DEPLOYED ON: Vercel (auto-detected in /api folder)
// ENV VAR REQUIRED: GROQ_API_KEY (set in Vercel dashboard)
// ============================================================

export default async function handler(req, res) {
  // ── SECTION: Method Check ──────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── SECTION: API Key Check ─────────────────────────────────
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is not set");
    return res.status(500).json({ error: "GROQ_API_KEY not configured in environment variables" });
  }

  try {
    // ── SECTION: Forward Request to Groq ──────────────────────
    const { messages } = req.body;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model:       "llama-3.3-70b-versatile",
        messages:    messages,
        max_tokens:  800,
        temperature: 0.7
      })
    });

    const data = await groqRes.json();

    console.log("Groq status:",   groqRes.status);
    console.log("Groq response:", JSON.stringify(data));

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({
        error:   data.error?.message || "Groq API error",
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    // ── SECTION: Error Handling ────────────────────────────────
    console.error("Handler error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
