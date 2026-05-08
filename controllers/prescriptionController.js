import Prescription from "../models/Prescription.js";
import Notification from "../models/Notification.js";
import { notificationMessages } from "../utils/notificationMessages.js";
import { sendNotification } from "../utils/sendNotification.js";
import { NOTIFICATION_EVENTS } from "../utils/notificationEvents.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";

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
    // const doctorName = req.user.fullName;
const doctorData = await Doctor.findById(prescription.doctor);

const doctorName = doctorData?.fullName || "Doctor";
const patientId = prescription.patient;

const notif = notificationMessages.prescription_added(doctorName);

await sendNotification({
  userId: patient,
  role: "Patient",
  type: "prescription_added",
  title: notif.title,
  message: notif.message,
  link: "/prescriptions",
});


    // ⚡ REAL-TIME SOCKET EMIT
    // global.io
    //   .to(patient.toString())
    //   .emit("newNotification", notification);
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
    // const doctorName = req.user.fullName;

const prescription = await Prescription.findById(req.params.id);
const doctorData = await Doctor.findById(prescription.doctor);

const doctorName = doctorData?.fullName || "Doctor";
const patientId = prescription.patient;

const notif = notificationMessages.prescription_updated(doctorName);

await sendNotification({
  userId: patientId,
  role: "Patient",
  type: "prescription_updated",
  title: notif.title,
  message: notif.message,
  link: "/prescriptions",
});
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
    const patientName = req.user.firstName;
const medicineName = medicine.name; 

// 👉 Patient notification
const patientNotif =
  notificationMessages.medicine_status_updated_patient(medicineName);

await sendNotification({
  userId: req.user.id,
  role: "Patient",
  type: "medicine_status_updated",
  title: patientNotif.title,
  message: patientNotif.message,
  link: "/prescriptions",
});

// 👉 Doctor notification
const doctorNotif =
  notificationMessages.medicine_status_updated_doctor(
    patientName,
    medicineName
  );

await sendNotification({
  userId: prescription.doctor,
  role: "Doctor",
  type: "medicine_status_updated",
  title: doctorNotif.title,
  message: doctorNotif.message,
  link: "/DoctorPrescription",
});
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

const prescription = await Prescription.findById(req.params.id)
  .populate("doctor", "fullName");

const patientId = prescription.patient;

const doctorData = await Doctor.findById(prescription.doctor);

const doctorName = doctorData?.fullName || "Doctor";

const notif = notificationMessages.prescription_status_updated(
  doctorName,
  pStatus
);

await sendNotification({
  userId: patientId,
  role: "Patient",
  type: "prescription_status_updated",
  title: notif.title,
  message: notif.message,
  link: "/prescriptions",
});
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
// Get active prescriptions for patient - Quick Access Prescriptions
export const getActivePrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patient: req.user.id,
      pStatus: "active", // or status depending on your schema
    })
      .populate("doctor", "fullName specialization")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: prescriptions,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};