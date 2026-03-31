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