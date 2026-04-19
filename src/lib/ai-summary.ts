import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { serverEnv } from "./env";

export async function generateSummary({
  title,
  content,
}: {
  title: string;
  content: string;
}): Promise<string> {
  const aiProvider = serverEnv.AI_PROVIDER || "openai";

  if (aiProvider === "gemini") {
    if (!serverEnv.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    const genAI = new GoogleGenerativeAI(serverEnv.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Please summarize this note titled "${title}":\n\n${content}\n\n- Keep summaries under 200 words\n- Focus on key points, action items, and insights.`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();
    if (!summary) throw new Error("No summary returned by Gemini");
    return summary;
  } else if (aiProvider === "groq") {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama3-70b-8192", // Usa modelo do .env ou padrão
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
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();
    if (!summary) throw new Error("No summary returned by Groq");
    return summary;
  } else {
    if (!serverEnv.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    const openai = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
    });
    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) throw new Error("No summary returned by OpenAI");
    return summary;
  }
}
