import express from "express";
import { registerDoctor } from "../controllers/doctorController.js";

const router = express.Router();

router.post("/register", registerDoctor);
// router.post("/login",loginPatient);

export default router;