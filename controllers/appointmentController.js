import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { sendNotification } from "../utils/sendNotification.js";
import { notificationMessages } from "../utils/notificationMessages.js";

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
        const [h, m] = time.split(":");

        hours = parseInt(h, 10);
        minutes = parseInt(m, 10);

        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
      } else {
        // ✅ FIXED PART
        const [h, m] = appt.time.split(":");

        hours = parseInt(h, 10);
        minutes = parseInt(m, 10);
      }
    }

    appointmentDate.setHours(hours, minutes, 0, 0);

    if (appointmentDate < now && appt.status === "pending") {
      await Appointment.updateOne(
        { _id: appt._id },
        { $set: { status: "rejected" } }
      );
      const doctorData = await Doctor.findById(appt.doctor);

const { title, message } =
  notificationMessages.appointment_rejected(doctorData.fullName);

await sendNotification({
  userId: appt.patient,
  role: "Patient",
  type: "appointment_rejected",
  title,
  message,
  link: "/PatientAppointment",
});
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
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);

    endOfDay.setHours(23, 59, 59, 999);
    // 🔍 Check if slot already exists (ignore cancelled)
    const existingAppointment = await Appointment.findOne({
      doctor: doctor,
      status: "approved",
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      time,
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
      type,
      meetingLink,
    });

    if (type === "videocall") {
      const roomName = `meditrack-${appointment._id}`;
      appointment.meetingLink = `https://meet.jit.si/${roomName}`;

      await appointment.save(); // save updated link
    }
    const doctorData = await Doctor.findById(appointment.doctor);

// 🔹 Patient notification
const { title: patientTitle, message: patientMessage } =
  notificationMessages.appointment_booked(doctorData.fullName);

await sendNotification({
  userId: appointment.patient,      
  role: "Patient",                  
  type: "appointment_booked",
  title: patientTitle,
  message: patientMessage,
  link: "/PatientAppointment",
});

// 🔹 Doctor notification
const patientName = req.user.firstName || "Patient";

const { title: doctorTitle, message: doctorMessage } =
  notificationMessages.appointment_request(patientName);

await sendNotification({
  userId: appointment.doctor,
  role: "Doctor",                   // ✅ FIXED
  type: "appointment_request",
  title: doctorTitle,
  message: doctorMessage,
  link: "/AppointmentView",
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
    // await autoRejectPastAppointments(appointments);
    try {
      await autoRejectPastAppointments(appointments);
    } catch (err) {
      console.error("Auto reject error:", err);
    }
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
    const doctorData = await Doctor.findById(appointment.doctor);

    const { title, message } =
      notificationMessages.appointment_completed(doctorData.fullName);

    await sendNotification({
      userId: appointment.patient,
      role: "Patient",
      type: "appointment_completed",
      title,
      message,
      link: "/PatientAppointment",
    });

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
      const doctorData = await Doctor.findById(appointment.doctor);

      const { title, message } =
        notificationMessages.appointment_confirmed(doctorData.fullName);

      await sendNotification({
        userId: appointment.patient,
        role: "Patient",
        type: "appointment_approved",
        title,
        message,
        link: "/PatientAppointment",
      });

      // AUTO REJECT OTHERS
      const rejectedAppointments = await Appointment.find({
  doctor: appointment.doctor,
  time: appointment.time,
  date: appointment.date,
  status: "pending",
  _id: { $ne: appointment._id },
});
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
for (const appt of rejectedAppointments) {
  const doctorData = await Doctor.findById(appt.doctor);

  const { title, message } =
    notificationMessages.appointment_rejected(doctorData.fullName);

  await sendNotification({
    userId: appt.patient,
    role: "Patient",
    type: "appointment_rejected",
    title,
    message,
    link: "/PatientAppointment",
  });
}
    } else {
      appointment.status = status;
      await appointment.save();

      if (status === "rejected") {
        const doctorData = await Doctor.findById(appointment.doctor);

        const { title, message } =
          notificationMessages.appointment_rejected(doctorData.fullName);

        await sendNotification({
          userId: appointment.patient,
          role: "Patient",
          type: "appointment_rejected",
          title,
          message,
          link: "/PatientAppointment",
        });
      }
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

// show appointments on admin side, patient
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
    const patientName = req.user.firstName || "Patient";

    const { title, message } =
      notificationMessages.appointment_cancelled(patientName);

    await sendNotification({
      userId: appointment.doctor,
      role: "Doctor",
      type: "appointment_cancelled",
      title,
      message,
      link: "/AppointmentView",
    });
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
    const { date, time, type } = req.body;
    const patientId = req.user.id;
    if (!date || !time) {
      return res.status(400).json({
        message: "Date and time are required",
      });
    }

    // const newDate = new Date(date);
    // newDate.setHours(0, 0, 0, 0);

    // const newDate = new Date(`${date}T12:00:00`);
    // const newDate = new Date(date);
    //   newDate.setHours(0, 0, 0, 0);
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
      _id: { $ne: appointment._id },
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
    appointment.type = type || appointment.type;
    appointment.status = "pending";

    if (appointment.type === "videocall") {
      const roomName = `meditrack-${appointment._id}`;
      appointment.meetingLink = `https://meet.jit.si/${roomName}`;
    } else {
      appointment.meetingLink = null;
    }

    await appointment.save();
    const { title, message } =
  notificationMessages.appointment_rescheduled(
    `${date} at ${time}`
  );

await sendNotification({
  userId: appointment.doctor,
  role: "Doctor",
  type: "appointment_rescheduled",
  title,
  message,
  link: "/AppointmentView",
});
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
export const getMyDoctors = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔥 ONLY completed appointments
    const appointments = await Appointment.find({
      patient: req.user.id,
      status: "completed"
    });

    const doctorIds = [
      ...new Set(
        appointments
          .map(a => a.doctor)
          .filter(Boolean)
          .map(id => id.toString())
      )
    ];

    const doctors = await Doctor.find({
      _id: { $in: doctorIds }
    }).select("fullName specialization");

    res.json(doctors);

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET PENDING REQUESTS ON DOCTOR DASHBOARD
export const getAppointmentRequests = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const requests = await Appointment.find({
      doctor: doctorId,
      status: "pending",
    })
      .populate("patient", "firstName lastName gender")
      .sort({ createdAt: -1 });

    // auto reject old pending
    await autoRejectPastAppointments(requests);

    const formatted = requests.map((appt) => ({
      _id: appt._id,
      patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
      gender: appt.patient.gender,
      date: appt.date,
      time: appt.time,
    }));

    res.status(200).json(formatted);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching requests" });
  }
};

// GET NEXT PATIENT ON DOCTOR DASHBOARD

export const getNextPatient = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Start of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get all upcoming approved appointments
    const appointments = await Appointment.find({
      doctor: doctorId,
      status: "approved",
      date: { $gte: todayStart }
    })
      .populate("patient")   // correct field
      .sort({ date: 1 });

    if (!appointments.length) {
      return res.status(404).json({
        message: "No upcoming patient"
      });
    }

    const now = new Date();

    let nextAppt = null;
    let minDiff = Infinity;

    // Find nearest appointment (date + time)
    appointments.forEach((appt) => {
      if (!appt.time) return;

      let [time, modifier] = appt.time.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      const apptDateTime = new Date(appt.date);
      apptDateTime.setHours(hours, minutes, 0, 0);

      const diff = apptDateTime - now;

      if (diff >= 0 && diff < minDiff) {
        minDiff = diff;
        nextAppt = appt;
      }
    });

    if (!nextAppt || !nextAppt.patient) {
      return res.status(404).json({
        message: "No upcoming patient"
      });
    }

    const p = nextAppt.patient;

    // Calculate age from DOB
    const calculateAge = (dob) => {
      if (!dob) return null;

      const birth = new Date(dob);
      const today = new Date();

      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      return age;
    };

    // Final response
    res.status(200).json({
      _id: p._id,
      name: `${p.firstName} ${p.lastName}`,
      dob: p.dob,
      gender: p.gender,
      // FIXED VALUES
      age: calculateAge(p.dob),
      bloodGroup: p.bloodGroup || "--"
    });

  } catch (error) {
    console.error("Next Patient Error:", error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};
// admin side appointment overview (chart data)
export const getAppointmentOverview = async (req, res) => {
  try {
    const { type = "daily" } = req.query;

    let groupId;

    if (type === "daily") {
      groupId = {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$date",
          timezone: "Asia/Kolkata"
        }
      };
    }

    else if (type === "monthly") {
      groupId = {
        $dateToString: {
          format: "%Y-%m",
          date: "$date",
          timezone: "Asia/Kolkata"
        }
      };
    }

    else if (type === "yearly") {
      groupId = {
        $dateToString: {
          format: "%Y",
          date: "$date",
          timezone: "Asia/Kolkata"
        }
      };
    }

    else if (type === "weekly") {
      groupId = {
        year: { $isoWeekYear: "$date" },
        week: { $isoWeek: "$date" }
      };
    }

    const data = await Appointment.aggregate([
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formatted = data.map(item => {
      if (type === "weekly") {
        return {
          label: `Week ${item._id.week}, ${item._id.year}`,
          count: item.count
        };
      }

      return {
        label: item._id,
        count: item.count
      };
    });

    res.status(200).json(formatted);

  } catch (error) {
    res.status(500).json({ message: "Error fetching overview" });
  }
};
//admin side appointment status (pie chart data)
// 📊 APPOINTMENT STATUS ANALYSIS
export const getAppointmentStatusStats = async (req, res) => {
  try {
    const data = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // format response
    const formatted = data.map(item => ({
      status: item._id,
      count: item.count
    }));

    res.status(200).json(formatted);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching status stats" });
  }
};
export const getDoctorPerformance = async (req, res) => {
  try {
    const data = await Appointment.aggregate([
      {
        $group: {
          _id: "$doctor",
          totalAppointments: { $sum: 1 },

          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },

          rejected: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0],
            },
          },
        },
      },

      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctorInfo",
        },
      },

      { $unwind: "$doctorInfo" },

      {
        $project: {
          doctorId: "$_id",

          // ✅ CORRECT FIELD MAPPING
          name: "$doctorInfo.fullName",
          specialization: "$doctorInfo.specialization",
          experience: "$doctorInfo.experience",

          rating: "$doctorInfo.averageRating",
          totalReviews: "$doctorInfo.totalReviews",

          totalAppointments: 1,
          completed: 1,
          rejected: 1,
        },
      },
    ]);

    // ✅ CALCULATE METRICS
    const doctorsWithScore = data.map((doc) => {
      const rating = doc.rating || 0;

      const successRate =
        doc.totalAppointments > 0
          ? (doc.completed / doc.totalAppointments) * 100
          : 0;

      // ✅ BALANCED SCORE FORMULA
      const score =
        doc.completed * 10 +
        doc.totalAppointments * 2 +
        rating * 15 -
        doc.rejected * 5;

      return {
        ...doc,
        successRate: Math.round(successRate),
        score: Math.max(0, Math.round(score)), // prevent negative
      };
    });

    // ✅ SORT BY SCORE (BEST FIRST)
    doctorsWithScore.sort((a, b) => b.score - a.score);

    // ✅ TOP PERFORMER (SAFE)
    const topDoctor =
      doctorsWithScore.length > 0 ? doctorsWithScore[0] : null;

    // ✅ MOST ACTIVE DOCTOR
    const mostActiveDoctor =
      doctorsWithScore.length > 0
        ? doctorsWithScore.reduce((max, curr) =>
            curr.totalAppointments > max.totalAppointments ? curr : max
          )
        : null;

    // ✅ LOW PERFORMERS (OPTIONAL BONUS)
    const lowPerformers = doctorsWithScore.filter(
      (doc) => doc.score < 20 && doc.totalAppointments > 0
    );

    res.status(200).json({
      success: true,
      count: doctorsWithScore.length,

      doctors: doctorsWithScore,
      topDoctor,
      mostActiveDoctor,
      lowPerformers,
    });
  } catch (error) {
    console.error("Doctor Performance Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor performance",
    });
  }
};
  export const getPatientBehavior = async (req, res) => {
    try {
      const appointments = await Appointment.find();

      if (!appointments.length) {
        return res.json(null);
      }

      // =========================
      // 📊 1. PEAK TIME
      // =========================
      const timeBuckets = {
        Morning: 0,   // 6–12
        Afternoon: 0, // 12–5
        Evening: 0,   // 5–10
        Night: 0      // 10–6
      };

      appointments.forEach(app => {
        const hour = new Date(app.createdAt).getHours();

        if (hour >= 6 && hour < 12) timeBuckets.Morning++;
        else if (hour >= 12 && hour < 17) timeBuckets.Afternoon++;
        else if (hour >= 17 && hour < 22) timeBuckets.Evening++;
        else timeBuckets.Night++;
      });

      const peakTime = Object.keys(timeBuckets).reduce((a, b) =>
        timeBuckets[a] > timeBuckets[b] ? a : b
      );

      // =========================
      // 🔁 2. REPEAT vs NEW
      // =========================
      const patientMap = {};

      appointments.forEach(app => {
        const id = app.patient?.toString();
        patientMap[id] = (patientMap[id] || 0) + 1;
      });

      let repeatPatients = 0;
      let newPatients = 0;

      Object.values(patientMap).forEach(count => {
        if (count > 1) repeatPatients++;
        else newPatients++;
      });

      // =========================
      // ❌ 3. CANCELLATION RATE
      // =========================
      const totalAppointments = appointments.length;

      const cancelledCount = appointments.filter(app =>
        app.status === "Cancelled"
      ).length;

      const cancellationRate = totalAppointments
  ? Math.round((cancelledCount / totalAppointments) * 100)
  : 0;

      // =========================
      // 📅 4. MOST ACTIVE DAY
      // =========================
      const dayMap = {
        Sunday: 0,
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0
      };

      appointments.forEach(app => {
  if (!app.patient) return;

  const id = app.patient.toString();

  patientMap[id] = (patientMap[id] || 0) + 1;
});

      const mostActiveDay = Object.keys(dayMap).reduce((a, b) =>
        dayMap[a] > dayMap[b] ? a : b
      );

      // =========================
      // ✅ FINAL RESPONSE
      // =========================
      res.json({
        peakTime,
        repeatPatients,
        newPatients,
        cancellationRate,
        mostActiveDay
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  };
export const getSystemGrowth = async (req, res) => {
  try {

    // 📊 DAILY GROWTH (same as before)
    const patients = await Patient.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          patients: { $sum: 1 }
        }
      }
    ]);

    const doctors = await Doctor.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          doctors: { $sum: 1 }
        }
      }
    ]);

    // ✅ NEW: APPROVED & REJECTED COUNT
    const approvedDoctors = await Doctor.countDocuments({ status: "approved" });
    const rejectedDoctors = await Doctor.countDocuments({ status: "rejected" });

    // 🔄 MERGE DAILY DATA
    const map = {};

    patients.forEach(p => {
      map[p._id] = { date: p._id, patients: p.patients, doctors: 0 };
    });

    doctors.forEach(d => {
      if (!map[d._id]) {
        map[d._id] = { date: d._id, patients: 0, doctors: d.doctors };
      } else {
        map[d._id].doctors = d.doctors;
      }
    });

    const result = Object.values(map).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // ✅ FINAL RESPONSE
    res.json({
      growth: result,
      approvedDoctors,
      rejectedDoctors
    });

  } catch (error) {
    console.error("Growth API Error:", error);
    res.status(500).json({ message: "Error", error: error.message });
  }
};