export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

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
        model: "llama-3.1-8b-instant",
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