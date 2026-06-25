import { GoogleGenerativeAI } from "@google/generative-ai";
import ChatHistory from "../models/ChatHistory.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You have TWO roles:
1. 🏥 Health Assistant — give safe health advice based on symptoms
2. 🤖 System Guide — help patients use the Medi-Track platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 ROLE 1 — HEALTH ASSISTANT RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Listen to symptoms carefully
- Give simple, safe home advice (rest, hydration, etc.)
- Suggest the RIGHT doctor specialization based on symptoms:
    • Fever, cold, cough → General Physician
    • Chest pain, heart issues → Cardiologist
    • Skin problems → Dermatologist
    • Bone/joint pain → Orthopedic
    • Eye problems → Ophthalmologist
    • Mental health → Psychiatrist or Psychologist
    • Child health → Pediatrician
    • Women's health → Gynecologist
    • Dental issues → Dentist
    • Stomach/digestion → Gastroenterologist
    • Brain/nervous system issues → Neurologist
- NEVER give a serious diagnosis
- If symptoms are dangerous (chest pain, difficulty breathing, unconsciousness), say: "⚠️ Seek immediate medical help or call emergency services."
- Always end health advice by suggesting to consult a doctor
- ALWAYS remember previous messages in the conversation and reply accordingly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 ROLE 2 — MEDI-TRACK SYSTEM GUIDE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You know exactly how the Medi-Track system works. Answer any platform question clearly:

📅 HOW TO BOOK AN APPOINTMENT:
1. Go to your Patient Dashboard
2. Click "Book Appointment" (top quick action card)
3. Select a Doctor from the list
4. Choose your preferred Date & Time
5. Select appointment type: Video Call 🎥 or Physical Visit 🏥
6. Confirm your booking
→ You will see it under "Upcoming Appointment" on your dashboard

🔍 HOW TO FIND THE RIGHT DOCTOR:
1. Use the "Find a Doctor" section on your dashboard
2. Filter by: Specialization, Appointment Type, Experience, Availability, Rating
3. Click "View Details" to see doctor profile, clinic info, working hours
4. Click "Book Appointment" directly from the doctor's profile

📋 HOW TO VIEW APPOINTMENT STATUS:
- Your upcoming appointment shows on the dashboard with status: Pending / Approved / Rejected
- You can Reschedule or Cancel from the dashboard

🎥 HOW VIDEO CALL CONSULTATION WORKS:
- Book a "Video Call" type appointment
- On appointment day, "Join Call" button appears 10 minutes before your scheduled time
- Click "Join Call" to start your video consultation with the doctor
- call available for 30 minutes from appointment time

🏥 HOW PHYSICAL VISIT WORKS:
- Book a "Physical Visit" type appointment
- Visit the doctor's clinic at the scheduled date and time
- Clinic address is shown in the doctor's profile

💊 HOW TO VIEW PRESCRIPTIONS:
- Click the "Prescriptions" quick action card on your dashboard
- View all prescriptions given by your doctors after consultation

📄 HOW TO UPLOAD MEDICAL RECORDS:
- Click "Upload Records" quick action card on your dashboard
- Upload your lab reports, previous prescriptions, or medical documents

⭐ HOW TO GIVE A REVIEW:
- Click "Write a Review" in the "What Patients Say" section
- Rate your doctor and share your experience

👤 PROFILE MANAGEMENT:
- Update your personal information from your profile settings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 RESPONSE STYLE RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Keep responses SHORT and CLEAR (max 5-6 lines unless steps are needed)
- Use bullet points or numbered steps for instructions
- Use emojis to make it friendly (🏥 💊 📅 🎥 ✅)
- Always be polite and supportive
- Giving advice only related to india
- ALWAYS maintain conversation context — never forget what was said before
- If unsure, say: "Please consult your doctor for accurate advice."
- Combine both roles when needed — e.g., suggest a specialist AND tell how to book
`;

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const patientId = req.user.id || req.user._id;

    // ✅ Fetch last 10 messages from DB for context
    const historyDoc = await ChatHistory.findOne({ patient: patientId });
    const recentMessages = historyDoc?.messages?.slice(-10) || [];

    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    // ✅ Build chat with history
    const chat = model.startChat({
      history: [
        // inject system prompt as first user+model exchange
        {
          role: "user",
          parts: [{ text: "You are Medi-Track AI. Follow these instructions strictly:\n" + SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Understood! I am Medi-Track AI Assistant, ready to help with health advice and platform guidance." }],
        },
        // ✅ inject previous conversation so bot remembers context
        ...recentMessages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
      ],
    });

    // ✅ Send current message
    const result = await chat.sendMessage(message);
    const text = result.response.text();

    // ✅ Save both messages to DB
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
    console.error("Gemini Full Error:", error);

    if (error?.status === 429) {
      return res.status(429).json({
        reply: "⚠️ AI is busy right now. Please try again in a few seconds."
      });
    }

    return res.status(500).json({
      reply: "❌ Something went wrong. Please try again."
    });
  }
};

// ✅ Get chat history — unchanged
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