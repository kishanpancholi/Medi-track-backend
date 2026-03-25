import Appointment from "../models/Appointment.js";

export const createAppointment = async (req, res) => {
  try {
    const { doctor, patientName, date, time } = req.body;

    const appointment = await Appointment.create({
      doctor,
      patientName,
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