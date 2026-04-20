

export async function generateSummary({
  title,
  content,
}: {
  title: string;
  content: string;
}): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that creates concise, structured summaries of notes. Keep summaries under 200 words and focus on key points, action items, and insights.",
          },
          {
            role: "user",
            content: `Please summarize this note titled \"${title}\":\n\n${content}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    },
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }
  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) throw new Error("No summary returned by Groq");
  return summary;
}
