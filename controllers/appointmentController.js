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