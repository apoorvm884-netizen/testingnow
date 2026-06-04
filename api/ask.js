const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, context } = req.body;
    const cacheKey = question.trim().toLowerCase() + "::" + context.slice(0, 500);

    if (cache.has(cacheKey)) {
      return res.status(200).json({
        answer: cache.get(cacheKey),
        cached: true
      });
    }

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "moonshotai/Kimi-K2-Instruct-0905",
        messages: [
          {
            role: "system",
            content: "You are a company support assistant. Answer only from the provided context. Keep the answer short, clear, and human. Use this exact format: Issue: <one short line> Action: <2 or 3 short steps> Escalation: <Yes or No, and where if needed>. If the answer is not found, say exactly: I could not find that in the support manual."
          },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion:\n${question}`
          }
        ],
        max_tokens: 140,
        temperature: 0.2
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || data.error || "Hugging Face request failed"
      });
    }

    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      "No answer returned.";

    cache.set(cacheKey, answer);

    return res.status(200).json({
      answer,
      cached: false
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
