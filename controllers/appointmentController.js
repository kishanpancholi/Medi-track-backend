import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

const autoRejectPastAppointments = async (appointments) => {
  const now = new Date();

  for (let appt of appointments) {
    const appointmentDate = new Date(appt.date);

    let hours = 0;
    let minutes = 0;

    if (appt.time) {
      if (appt.time.includes("AM") || appt.time.includes("PM")) {
        const [time, modifier] = appt.time.split(" ");
        let [h, m] = time.split(":");

        hours = parseInt(h);
        minutes = parseInt(m);

        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
      } else {
        const [h, m] = appt.time.split(":");
        hours = parseInt(h);
        minutes = parseInt(m);
      }
    }

    appointmentDate.setHours(hours, minutes, 0, 0);

    // ✅ MAIN LOGIC
    if (appointmentDate < now && appt.status === "pending") {
      appt.status = "rejected";
      await appt.save();
    }
  }
};

// to create an appointment (stores an appointment in database)
export const createAppointment = async (req, res) => {
  try {
    const { doctor, patient, date, time } = req.body;

    // const selectedDate = new Date(date);
    // selectedDate.setHours(0, 0, 0, 0);

    const selectedDate = new Date(`${date}T12:00:00`);

    // 🔍 Check if slot already exists (ignore cancelled)
    const existingAppointment = await Appointment.findOne({
  doctor,
  time,
  status: "approved", // 🔥 ONLY approved blocks slot
  date: {
    $gte: selectedDate,
    $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000),
  },
});

    if (existingAppointment) {
      return res.status(400).json({
        message: "This time slot is already booked",
      });
    }

    const appointment = await Appointment.create({
      doctor,
      patient,
      date: selectedDate,
      time,
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });

  } catch (error) {
    console.error(error);

    // 🔥 Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "This time slot is already booked",
      });
    }

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

    // ✅ AUTO REJECT PAST PENDING
    await autoRejectPastAppointments(appointments);

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

// update the status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 🔥 If approving, check existing approved slot
    if (status === "approved") {
      const start = new Date(appointment.date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(appointment.date);
      end.setHours(23, 59, 59, 999);

      const existingApproved = await Appointment.findOne({
        doctor: appointment.doctor,
        time: appointment.time,
        status: "approved",
        date: { $gte: start, $lte: end },
        _id: { $ne: appointment._id },
      });

      if (existingApproved) {
        return res.status(400).json({
          message: "Another appointment already approved for this slot",
        });
      }

      // ✅ Approve this appointment
      appointment.status = "approved";
      await appointment.save();

      // 🔥 AUTO REJECT OTHERS
      await Appointment.updateMany(
        {
          doctor: appointment.doctor,
          time: appointment.time,
          date: appointment.date,
          status: "pending",
          _id: { $ne: appointment._id },
        },
        { status: "rejected" }
      );

    } else {
      // Normal update (rejected / completed / cancelled)
      appointment.status = status;
      await appointment.save();
    }

    res.status(200).json({
      message: "Status updated successfully",
      appointment,
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
      .populate("doctor", "fullName specialization")   // get doctor name
      .populate("patient", "firstName lastName")  // get patient name
      .sort({ date: -1 });

    // ✅ AUTO REJECT PAST PENDING
    await autoRejectPastAppointments(appointments);

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

    // const newDate = new Date(date);
    // newDate.setHours(0, 0, 0, 0);

    const newDate = new Date(`${date}T12:00:00`);

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

    // 🔍 Check if new slot already booked
    const existingAppointment = await Appointment.findOne({
  doctor: appointment.doctor,
  time,
  status: "approved", // 🔥 IMPORTANT
  date: {
    $gte: newDate,
    $lt: new Date(newDate.getTime() + 24 * 60 * 60 * 1000),
  },
});

    if (existingAppointment) {
      return res.status(400).json({
        message: "This time slot is already booked",
      });
    }

    appointment.date = newDate;
    appointment.time = time;
    appointment.status = "pending";

    await appointment.save();

    res.status(200).json({
      message: "Appointment rescheduled successfully",
      appointment,
    });

  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "This time slot is already booked",
      });
    }

    res.status(500).json({ message: error.message });
  }
};

// to get count on doctor side
export const getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.user.id;

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

const generateTimeSlots = (startTime, endTime) => {
  const slots = [];

  let [startHour, startMin] = startTime.split(":").map(Number);
  let [endHour, endMin] = endTime.split(":").map(Number);

  let start = new Date();
  start.setHours(startHour, startMin, 0, 0);

  let end = new Date();
  end.setHours(endHour, endMin, 0, 0);

  while (start < end) {
    let hours = start.getHours();
    let minutes = start.getMinutes();

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    const formatted =
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;

    slots.push(formatted);

    start.setMinutes(start.getMinutes() + 30);
  }

  return slots;
};

export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const workingHours = doctor.workingHours[0]; // get first slot

    const startTime = workingHours.start;
    const endTime = workingHours.end;

    const allSlots = generateTimeSlots(startTime, endTime);

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctor: doctorId,
      status: "approved",
      date: { $gte: start, $lte: end },
    });

    const bookedSlots = appointments.map(app => app.time);

    const availableSlots = allSlots.filter(
      slot => !bookedSlots.includes(slot)
    );

    res.json({ allSlots, bookedSlots, availableSlots });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================== GET BOOKED SLOTS ==================
export const getBookedSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
  doctor: doctorId,
  status: "approved", // 🔥 only approved slots blocked
  date: {
    $gte: selectedDate,
    $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000),
  },
});

    const bookedSlots = appointments.map(app => app.time);

    res.json(bookedSlots);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};