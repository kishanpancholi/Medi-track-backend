import MedicalRecord from "../models/MedicalRecord.js";
import Patient from "../models/Patient.js";

// ➤ Create Record
// export const createRecord = async (req, res) => {
//   try {
//     const record = await MedicalRecord.create(req.body);
//     res.status(201).json(record);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const createRecord = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    console.log("USER:", req.user);

    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { title, type, doctorId, date, description } = req.body;

    // 🔥 STRICT VALIDATION
    if (!title || !type || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["lab", "scan", "prescription"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const fileUrl = req.file?.path;

    if (!fileUrl) {
      return res.status(400).json({ message: "File upload failed" });
    }
    console.log("CLOUDINARY FILE:", req.file);
    // 🔥 FORCE VALID DATE
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
      uploadedBy: "patient",
    });

    return res.status(201).json(record);

  } catch (error) {
    console.log("🔥 ERROR NAME:", error.name);
    console.log("🔥 ERROR MESSAGE:", error.message);
    console.log("🔥 FULL ERROR:", error);

    return res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};

// ➤ Get Records (with search, filter, pagination)
// export const getPatientRecords = async (req, res) => {
//   try {
//     const { patientId } = req.params;
//     const { search, type, page = 1, limit = 10 } = req.query;

//     if (req.user.id !== patientId) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     let query = { patient: patientId };

//     if (type && type !== "all") {
//       query.type = type;
//     }

//     if (search) {
//       query.title = { $regex: search, $options: "i" };
//     }

//     const records = await MedicalRecord.find(query)
//       .sort({ date: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     const total = await MedicalRecord.countDocuments(query);

//     res.json({
//       total,
//       page: Number(page),
//       pages: Math.ceil(total / limit),
//       records,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
export const getPatientRecords = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;
    const { search } = req.query;

    // 🔒 ensure doctor only sees his own patients
    const query = {
      doctor: doctorId,
      patient: patientId
    };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const records = await MedicalRecord.find(query)
      .sort({ date: -1 });

    res.json(records);

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

// ➤ Delete Record
// export const deleteRecord = async (req, res) => {
//   try {
//     const record = await MedicalRecord.findById(req.params.id);

//     if (!record) {
//       return res.status(404).json({ message: "Record not found" });
//     }

//     await record.deleteOne();

//     res.json({ message: "Deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

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

    console.log("Records Found:", records);

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