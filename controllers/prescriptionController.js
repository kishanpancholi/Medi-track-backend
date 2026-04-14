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
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Patient gets prescriptions
export const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patient: req.user.id,
    })
    .populate("patient", "firstName lastName")
    .populate("doctor", "fullName specialization")
    .sort({ createdAt: -1 });

   res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all prescription on Doctor side
export const getDoctorPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      doctor: req.user.id,
    })
      .populate("patient", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single prescription
export const getSinglePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("doctor", "fullName")
      .populate("patient", "firstName lastName");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update prescription (full)
export const updatePrescription = async (req, res) => {
  try {
    const updated = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Medicine status only
export const updateMedicineStatus = async (req, res) => {
  try {
    const { prescriptionId, medicineId } = req.params;
    const { mStatus } = req.body;

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const medicine = prescription.medicines.id(medicineId);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    medicine.mStatus = mStatus;

    await prescription.save();

    res.status(200).json({
      success: true,
      message: "Medicine status updated",
      data: prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Prescription status
export const updatePrescriptionStatus = async (req, res) => {
  try {
    const { pStatus } = req.body;

    const updated = await Prescription.findByIdAndUpdate(
      req.params.id,
      { pStatus },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Prescription status updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete prescription
export const deletePrescription = async (req, res) => {
  try {
    await Prescription.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};