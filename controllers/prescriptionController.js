import Prescription from "../models/Prescription.js";

// Doctor creates prescription
export const createPrescription = async (req, res) => {
  try {
    const { patient, diagnosis, medicines, notes } = req.body;

    const prescription = await Prescription.create({
      doctor: req.user.id,
      patient,
      diagnosis,
      medicines,
      notes,
    });

    res.status(201).json({
      message: "Prescription saved",
      prescription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Patient gets prescriptions
export const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patient: req.user._id,
    }).populate("doctor", "fullName");

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};