export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, context } = req.body;

    const prompt = `
You are a support assistant.
Answer only from the given support manual data.
If the answer is not found in the data, say: I could not find that in the support manual.

Support manual data:
${context}

User question:
${question}
`;

    const hfRes = await fetch("https://router.huggingface.co/hf-inference/models/google/flan-t5-base", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt
      })
    });

    const data = await hfRes.json();

    if (!hfRes.ok) {
      return res.status(500).json({
        error: data.error || "Hugging Face request failed"
      });
    }

    let answer = "No answer returned.";

    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      answer = data[0].generated_text;
    } else if (data.generated_text) {
      answer = data.generated_text;
    } else {
      answer = JSON.stringify(data);
    }

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
