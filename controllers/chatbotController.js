import { GoogleGenerativeAI } from "@google/generative-ai";
import ChatHistory from "../models/ChatHistory.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const patientId = req.user.id || req.user._id;

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

    // ✅ Save both user message and bot reply to DB
    await ChatHistory.findOneAndUpdate(
      { patient: patientId },
      {
        $push: {
          messages: {
            $each: [
              { role: "user", text: message },
              { role: "bot", text: text },
            ],
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({ reply: text });

  } catch (error) {
    console.error("Gemini Error:",error);
    if (error.status === 429) {
      return res.status(429).json({ error: "AI service busy. Try again later." });
    }
    res.status(500).json({ error: "Gemini API Failed" });
  }
};

// ✅ Get chat history
export const getChatHistory = async (req, res) => {
  try {
    const patientId = req.user.id || req.user._id;
    const history = await ChatHistory.findOne({ patient: patientId });
    res.json({ messages: history?.messages || [] });
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// ✅ Clear chat history
export const clearChatHistory = async (req, res) => {
  try {
    const patientId = req.user.id || req.user._id;
    await ChatHistory.findOneAndUpdate(
      { patient: patientId },
      { $set: { messages: [] } }
    );
    res.json({ message: "Chat history cleared" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear history" });
  }
};
