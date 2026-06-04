export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, context } = req.body;

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
            content: "You are a company support assistant. Answer only from the provided context. Give a short, direct answer in 1 to 3 short lines only. Do not explain too much. Do not copy full paragraphs. If helpful, give only 2 or 3 action steps. If the answer is not found, say exactly: I could not find that in the support manual."
          },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion:\n${question}\n\nReply in very short human wording. Maximum 60 words.`
          }
        ],
        max_tokens: 120,
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

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
