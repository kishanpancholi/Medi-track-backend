// import express from "express";
// import { registerPatient } from "../controllers/patientController.js";

// const router = express.Router();

// router.post("/register", registerPatient);

// export default router;


import express from "express";
import Patient from "../models/Patient.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    console.log("Received Data:", req.body);

    const newPatient = new Patient(req.body);
    await newPatient.save();

    res.json({ message: "Patient Registered Successfully", data: newPatient });

  } catch (error) {
    res.status(500).json({ error: "Error saving patient" });
  }
});

export default router;