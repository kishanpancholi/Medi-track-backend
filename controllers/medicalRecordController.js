import MedicalRecord from "../models/MedicalRecord.js";
import Patient from "../models/Patient.js";
import { sendNotification } from "../utils/sendNotification.js";
import { notificationMessages } from "../utils/notificationMessages.js";
import genAI from "../utils/gemini.js";
import axios from "axios";
import ReactMarkdown from "react-markdown";

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

    // ── 1. Find record ──────────────────────────────────────
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: "Medical record not found." });
    }

    // ── 2. Return cached summary if exists ──────────────────
    if (record.aiSummary?.text) {
      return res.json({ summary: record.aiSummary.text });
    }

    // ── 3. Validate file URL ────────────────────────────────
    if (!record.fileUrl) {
      return res.status(400).json({ message: "No file attached to this record." });
    }

    // ── 4. Fetch image from Cloudinary ──────────────────────
    const imageResponse = await axios.get(record.fileUrl, {
      responseType: "arraybuffer",
    });
    const base64Image = Buffer.from(imageResponse.data).toString("base64");

    // ── 5. Detect MIME type safely ──────────────────────────
    const fileName = (record.fileName || record.fileUrl || "").toLowerCase();
    let mimeType = "image/jpeg"; // default
    if (fileName.endsWith(".png"))  mimeType = "image/png";
    if (fileName.endsWith(".pdf"))  mimeType = "application/pdf";
    if (fileName.endsWith(".webp")) mimeType = "image/webp";

    console.log("📄 Processing file:", fileName, "| MIME:", mimeType);

    // ── 6. Generate AI Summary ──────────────────────────────
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: `
You are an experienced medical AI assistant helping patients understand their medical reports.

=========================
CRITICAL FORMATTING RULES
=========================

- You MUST use proper Markdown with blank lines between every section.
- NEVER put two sections on the same line.
- Each heading must be on its OWN line, preceded and followed by a blank line.
- Each bullet point must be on its OWN line.
- Use simple English — the patient is not a doctor.
- Maximum 300 words.
- Explain medical terms in simple language inside brackets like: Hemoglobin [a protein in blood that carries oxygen].
- Never invent information. If missing, write "Not Mentioned".
- Only mention abnormal results unless normal ones are clinically significant.
- Maintain a calm, reassuring tone.
- Return ONLY valid Markdown. No HTML. No triple backtick code blocks.

=========================
REQUIRED STRUCTURE
=========================

# 🩺 Medical Report Summary

## 👤 Patient Details

- **Age:** [value or Not Mentioned]
- **Gender:** [value or Not Mentioned]

## 📄 Report Information

- **Report Type:** [e.g., CBC Blood Test]
- **Purpose:** [why this test was done]

## 🔍 Key Findings

- **[Finding Name]**
  [One sentence explanation in plain English]

## ⚠️ Important Concerns

[Only mention serious or unusual findings. If none, write: No major concerns detected.]

## 🩺 Overall Summary

[2–3 simple sentences summarizing the patient's overall condition.]

## ✅ Recommended Next Steps

- [Action 1]
- [Action 2]
- [Action 3]

---
Now analyze the uploaded medical report and generate the summary strictly following the above format.
`,
            },
          ],
        },
      ],
    });

    // ── 7. Extract text safely ──────────────────────────────
    // Try multiple access patterns depending on SDK version
    const aiResponse =
      result?.text ||                                              // some SDK versions
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||      // standard
      result?.response?.text?.();                                 // older pattern

    if (!aiResponse) {
      console.error("❌ Gemini returned empty/null response:", JSON.stringify(result, null, 2));
      return res.status(500).json({ message: "AI returned an empty response." });
    }

    console.log("✅ AI Summary generated, length:", aiResponse.length);

    // ── 8. Cache and save ───────────────────────────────────
    record.aiSummary = {
      text: aiResponse,
      generatedAt: new Date(),
    };
    await record.save();

    return res.json({ summary: aiResponse });

  } catch (error) {
    // ── 9. Detailed error logging ───────────────────────────
    console.error("❌ AI SUMMARY ERROR:", error.message);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      message: "Failed to generate AI summary.",
      error: error.message,
    });
  }
};