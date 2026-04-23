import MedicalRecord from "../models/MedicalRecord.js";

// ➤ Create Record
export const createRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get Records (with search, filter, pagination)
export const getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { search, type, page = 1, limit = 10 } = req.query;

    let query = { patient: patientId };

    if (type && type !== "all") {
      query.type = type;
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const records = await MedicalRecord.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await MedicalRecord.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      records,
    });
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
export const deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    await record.deleteOne();

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};