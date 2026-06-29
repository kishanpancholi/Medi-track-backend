import MedicalRecord from "../models/MedicalRecord.js";
import Patient from "../models/Patient.js";
import { sendNotification } from "../utils/sendNotification.js";
import { notificationMessages } from "../utils/notificationMessages.js";
import genAI from "../utils/gemini.js";
import axios from "axios";

export const createRecord = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { title, type, doctorId, date, description } = req.body;

    if (!title || !type || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["report", "scan", "prescription"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const normalizedType = type.toLowerCase();

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const fileUrl = req.file.path;
    const fileName = req.file.originalname;

    const safeDate = new Date(date);
    if (isNaN(safeDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const record = await MedicalRecord.create({
      patient: userId,
      title: title.trim(),
      type: normalizedType,
      doctor: doctorId,
      date: safeDate,
      description,
      fileUrl,
      fileName,
      uploadedBy: "patient",
    });
    const patientData = await Patient.findById(userId);
    const patientName = `${patientData.firstName} ${patientData.lastName}`;

    const notif = notificationMessages.record_uploaded(patientName);

    await sendNotification({
      userId: doctorId,
      role: "Doctor",
      type: "record_uploaded",
      title: notif.title,
      message: notif.message,
      link: "/DoctorMedicalRecords",
    });
    return res.status(201).json(record);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};

// doctor can see only their patient records
export const getPatientRecords = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;

    const records = await MedicalRecord.find({
      doctor: doctorId,
      patient: patientId,
    }).sort({ date: -1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Record
export const getRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // SECURITY CHECK
    if (record.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await record.deleteOne();

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};
// load patient names in dropdown on doctor side medical records page
export const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const records = await MedicalRecord.find({
      doctor: doctorId,
    }).select("patient");

    // console.log("Records Found:", records);

    const patientIds = [
      ...new Set(
        records
          .filter((r) => r.patient) // ✅ FIX
          .map((r) => r.patient.toString()),
      ),
    ];

    const patients = await Patient.find({
      _id: { $in: patientIds },
    }).select("firstName lastName dob gender");

    const formattedPatients = patients.map((p) => ({
      _id: p._id,
      name: `${p.firstName} ${p.lastName}`,
      age: calculateAge(p.dob),
      gender: p.gender,
    }));

    res.json(formattedPatients);
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// patient records
export const getMyRecords = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const records = await MedicalRecord.find({
      patient: userId,
    })
      .populate("doctor", "fullName")
      .sort({ date: -1 });

    res.json({ records });
  } catch (error) {
    console.log("GET MY RECORDS ERROR:", error); // 🔥 IMPORTANT
    res.status(500).json({ message: error.message });
  }
};
export const generateSummary = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // ✅ Return cached summary if exists
    if (record.aiSummary?.text) {
      return res.json({ summary: record.aiSummary.text });
    }

    // ✅ 1. Fetch image from Cloudinary
    const imageResponse = await axios.get(record.fileUrl, {
      responseType: "arraybuffer",
    });

    const base64Image = Buffer.from(imageResponse.data).toString("base64");

    // ✅ 2. Detect MIME type
    const mimeType = record.fileName.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg";

    // ✅ 3. Call Gemini (NEW SDK)
    const result = await genAI.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: `You are a medical assistant AI. Your task is to read a medical report, scan or prescription and generate a clear, simple, and well-structured summary for a non-medical person.

Follow these rules strictly:

1. Use very simple language (avoid complex medical terms, or explain them in brackets).
2. Keep the summary short, clean, and easy to read.
3. Format the output in clear sections using headings and bullet points.
4. Highlight important findings and risks clearly.
5. Do NOT include unnecessary technical jargon.
6. Add brief explanations wherever medical terms are used.
7. End with clear advice on what the patient should do next.
8. Keep a calm and helpful tone.

Use this format:

---

### 👤 Patient Details

* Age:
* Gender:

### 📄 Scan Details

* Type of Scan:
* Purpose:

### 🔍 Key Findings (Explained Simply)

* Write 3 to 5 important findings from the report.
* Do NOT use "Finding 1, 2, 3".
* Each finding must:
  * Start with a short, meaningful title (example: "Bone Loss in Gums")
  * Follow with a simple explanation in 1–2 lines
  * Explain any medical terms in brackets
* Focus only on the most important and relevant issues.

### ⚠️ Important Concerns

* Mention serious issues or things needing attention

### 🩺 What This Means

* Explain overall condition in 2–3 simple lines

### ✅ What To Do Next

* Clear next steps (consult doctor, further tests, etc.)

### ⚠️ Disclaimer

This is an AI-generated summary and not a medical diagnosis. Please consult a doctor for proper advice.

---

Now generate the summary based on the provided medical report.
`,
            },
          ],
        },
      ],
    });

    // ✅ 4. Extract response (NEW SDK)
    const aiResponse = result.text;

    // ✅ 5. Save to DB
    record.aiSummary = {
      text: aiResponse,
      generatedAt: new Date(),
    };

    await record.save();

    // ✅ 6. Send response
    res.json({ summary: aiResponse });

  } catch (error) {
    console.error("AI ERROR:", error);
    res.status(500).json({
      message: "AI summary failed",
      error: error.message,
    });
  }
};