import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

//auto rejected past appointment when appointment time is over
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

    // MAIN LOGIC
    if (appointmentDate < now && appt.status === "pending") {
      appt.status = "rejected";
      await appt.save();
    }
  }
};

// to create an appointment (stores an appointment in database)
export const createAppointment = async (req, res) => {
  try {
    let { doctor, patient, date, time, type, meetingLink } = req.body;

    // const selectedDate = new Date(date);
    // selectedDate.setHours(0, 0, 0, 0);

    const selectedDate = new Date(`${date}T12:00:00`);

    // 🔍 Check if slot already exists (ignore cancelled)
    const existingAppointment = await Appointment.findOne({
  doctor,
  time,
  status: "approved", // ONLY approved blocks slot
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

    //  jitsi video link

    if (type === "video") {
      const roomName = `meditrack-${doctor}-${patient}-${Date.now()}`;
      meetingLink = `https://meet.jit.si/${roomName}`;
    }


    const appointment = await Appointment.create({
      doctor,
      patient,
      date: selectedDate,
      time,
      type, 
      meetingLink,
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });

  } catch (error) {
    console.error(error);

    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "This time slot is already booked",
      });
    }

    res.status(500).json({ message: error.message });
  }
};
// meeting details(video)
export const getMeetingDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 👇 Role logic
    const role = req.user.role; // "doctor" or "patient"

    res.json({
      meetingLink: appointment.meetingLink,
      role
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// show appointments of particular doctor
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id; // logged-in doctor id

    const appointments = await Appointment.find({ doctor: doctorId })
      .populate("patient", "firstName lastName email mobile gender") // get patient info
      .sort({ date: 1 });

    // AUTO REJECT PAST PENDING
    await autoRejectPastAppointments(appointments);

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

// get today's appointments on doctor dashboard(only patient name + time)
export const getTodayAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: "approved",
    })
      .populate("patient", "firstName lastName")
      .select("time patient")
      .sort({ time: 1 })
      .limit(5);

    // AUTO REJECT (reuse your logic)
    await autoRejectPastAppointments(appointments);

    const result = appointments.map((appt) => ({
      _id: appt._id,
      patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
      time: appt.time,
    }));

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching today appointments" });
  }
};

export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Not found" });
    }

    appointment.status = "completed"; // ONLY UPDATE STATUS
    await appointment.save();

    res.json({ message: "Appointment completed" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
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

    // If approving, check existing approved slot
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

      // Approve this appointment
      appointment.status = "approved";
      await appointment.save();

      // AUTO REJECT OTHERS
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

    // AUTO REJECT PAST PENDING
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

    // check patient ownership
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

    // check patient ownership
    if (appointment.patient.toString() !== patientId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // cannot reschedule cancelled/completed
    if (["cancelled", "completed"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Cannot reschedule this appointment",
      });
    }

    // Check if new slot already booked
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

    const totalCompleted = await Appointment.countDocuments({
      doctor: doctorId,
      status: "completed",
    });

    res.status(200).json({
      totalPatients: totalPatients.length,
      todayPatients: todayPatients.length,
      totalCompleted,
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
// GET BOOKED SLOTS 
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    // CHECK WORKING DAY
const selectedDate = new Date(date);

const dayName = selectedDate.toLocaleString("en-US", {
  weekday: "long",
});

// If doctor is NOT working on that day → return empty slots
if (!doctor.workingDays.includes(dayName)) {
  return res.json({
    allSlots: [],
    bookedSlots: [],
    availableSlots: [],
    isWorkingDay: false, 
  });
}

    let allSlots = [];

    doctor.workingHours.forEach(slot => {
      const slots = generateTimeSlots(slot.start, slot.end);
      allSlots.push(...slots);
    });

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

export const getBookedSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
  doctor: doctorId,
  status: "approved", // only approved slots blocked
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