import MedicalRecord from "../models/MedicalRecord.js";
import Patient from "../models/Patient.js";

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

    if (!["Report", "scan", "prescription"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    console.log("UPLOAD DEBUG:", req.file); // 🔥 ADD THIS

    const fileUrl = req.file.path; // ✅ NO CHANGE
    const fileName = req.file.originalname;

    const safeDate = new Date(date);
    if (isNaN(safeDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const record = await MedicalRecord.create({
      patient: userId,
      title: title.trim(),
      type,
      doctor: doctorId,
      date: safeDate,
      description,
      fileUrl,
      fileName,
      uploadedBy: "patient",
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
      patient: patientId
    }).sort({ date: -1 });

    res.json({ records });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get Single Record
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
      doctor: doctorId
    }).select("patient");

    // console.log("Records Found:", records);

    const patientIds = [
      ...new Set(
        records
          .filter(r => r.patient) // ✅ FIX
          .map(r => r.patient.toString())
      )
    ];

    const patients = await Patient.find({
      _id: { $in: patientIds }
    }).select("firstName lastName dob gender");

    const formattedPatients = patients.map(p => ({
      _id: p._id,
      name: `${p.firstName} ${p.lastName}`,
      age: calculateAge(p.dob),
      gender: p.gender
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
      patient: userId
    })
    .populate("doctor", "fullName")
    .sort({ date: -1 });

    res.json({ records });

  } catch (error) {
    console.log("GET MY RECORDS ERROR:", error); // 🔥 IMPORTANT
    res.status(500).json({ message: error.message });
  }
};