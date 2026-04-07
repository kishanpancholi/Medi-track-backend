import Appointment from "../models/Appointment.js";

// to create an appointment (stores an appointment in database)
export const createAppointment = async (req, res) => {
  try {
    const { doctor, patient, date, time } = req.body;

    const appointment = await Appointment.create({
      doctor,
      patient,
      date,
      time,
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
 
// show appointments of particular doctor
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id; // logged-in doctor id

    const appointments = await Appointment.find({ doctor: doctorId })
      .populate("patient", "firstName lastName") // get patient name
      .sort({ date: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

// update the status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params; // appointment id
    const { status } = req.body; // approved / rejected

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

     if (!updatedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({
      message: "Status updated successfully",
      updatedAppointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating status" });
  }
};

// show appointments on admin side
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("doctor", "fullName")   // get doctor name
      .populate("patient", "firstName lastName")  // get patient name
      .sort({ date: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching all appointments" });
  }
};

// Cancel appointment (only patient)
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 🔒 check patient ownership
    if (appointment.patient.toString() !== patientId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reschedule appointment (only patient)
export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { date, time } = req.body;
    const patientId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 🔒 check patient ownership
    if (appointment.patient.toString() !== patientId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ❌ cannot reschedule cancelled/completed
    if (["cancelled", "completed"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Cannot reschedule this appointment",
      });
    }

    appointment.date = date;
    appointment.time = time;
    appointment.status = "pending";

    await appointment.save();

    res.status(200).json({
      message: "Appointment rescheduled successfully",
      appointment,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// to get count on doctor side
export const getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.user.id; // use id (your code uses id, not _id)

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const totalPatients = await Appointment.distinct("patient", {
      doctor: doctorId,
    });

    const todayPatients = await Appointment.distinct("patient", {
      doctor: doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const todayCompleted = await Appointment.countDocuments({
      doctor: doctorId,
      status: "completed",
      date: { $gte: todayStart, $lte: todayEnd },
    });

    res.status(200).json({
      totalPatients: totalPatients.length,
      todayPatients: todayPatients.length,
      todayCompleted,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};