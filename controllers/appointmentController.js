import Appointment from "../models/Appointment.js";

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

export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id; // logged-in doctor id

    const appointments = await Appointment.find({ doctor: doctorId })
      .populate("patient", "name") // get patient name
      .sort({ date: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

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
      .populate("doctor", "name")   // get doctor name
      .populate("patient", "name")  // get patient name
      .sort({ date: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching all appointments" });
  }
};