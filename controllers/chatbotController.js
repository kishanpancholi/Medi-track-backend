import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    /* const prompt = `
    You are a medical assistant chatbot.
    User will provide disease symptoms.
    Give simple advice, precautions, and suggest doctor consultation if needed.

    Symptoms: ${message}
    `; */

    const prompt = `
You are a healthcare assistant.

Rules:
- Do NOT give serious diagnosis
- Always suggest consulting a doctor
- Give simple and safe advice
- If symptoms are dangerous, say "Seek immediate medical help"

User symptoms: ${message}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("Gemini Error:",error);
    res.status(500).json({ error: "Gemini API Failed" });
  }
};