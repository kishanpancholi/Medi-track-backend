export const notificationMessages = {
  // 💊 Prescription
  prescription_added: (doctor) => ({
    title: "Prescription Added",
    message: `Dr. ${doctor} added a new prescription`,
  }),

  // 📅 Appointment booked (pending confirmation case if you use it)
  appointment_booked: (doctor) => ({
    title: "Appointment Booked",
    message: `Your appointment request is sent to Dr. ${doctor}`,
  }),
  // 📅 New appointment request (for doctor)
  appointment_request: (patient) => ({
    title: "New Appointment Request",
    message: `You have an appointment request from ${patient}`,
  }),

  // ✅ Appointment confirmed
  appointment_confirmed: (doctor) => ({
    title: "Appointment Confirmed",
    message: `Your appointment with Dr. ${doctor} is confirmed`,
  }),

  // ❌ Appointment rejected
  appointment_rejected: (doctor) => ({
    title: "Appointment Rejected",
    message: `Your appointment with Dr. ${doctor} was rejected`,
  }),

  // 🔄 Appointment rescheduled
  appointment_rescheduled: (time) => ({
    title: "Appointment Rescheduled",
    message: `Your appointment has been rescheduled to ${time}`,
  }),

  // ❌ Appointment cancelled
  appointment_cancelled: (doctor) => ({
    title: "Appointment Cancelled",
    message: `Your appointment with Dr. ${doctor} has been cancelled`,
  }),

  // 🟢 Appointment completed
  appointment_completed: (doctor) => ({
    title: "Appointment Completed",
    message: `Your appointment with Dr. ${doctor} is completed`,
  }),

  // 📄 Medical Record Uploaded (Patient → Doctor)
  record_uploaded: (patient) => ({
    title: "New Medical Record",
    message: `${patient} uploaded a new medical record`,
  }),

  // 📄 Medical Record Reviewed (Doctor → Patient) (optional but useful)
  record_reviewed: (doctor) => ({
    title: "Record Reviewed",
    message: `Dr. ${doctor} reviewed your medical record`,
  }),
prescription_added: (doctor) => ({
  title: "New Prescription",
  message: `Dr. ${doctor} added a new prescription for you`,
}),

prescription_updated: (doctor) => ({
  title: "Prescription Updated",
  message: `Dr. ${doctor} updated your prescription`,
}),

prescription_status_updated: (doctor, status) => ({
  title: "Prescription Status Updated",
  message: `Dr. ${doctor} marked your prescription as ${status}`,
}),

// medicine_status_updated_patient: (medicine) => ({
//   title: "Medicine Updated",
//   message: `You marked ${medicine} as taken`,
// }),

// medicine_status_updated_doctor: (patient, medicine) => ({
//   title: "Medicine Update",
//   message: `${patient} marked ${medicine} as taken`,
// }),

  // ⭐ Review Added (Patient → Doctor)
 review_added: (patient, rating) => ({
  title: "New Review",
  message: `${patient} gave you a ${rating}★ review`,
}),

patient_registered: (patient) => ({
  title: "New Patient Registered",
  message: `${patient} registered successfully`,
}),

};