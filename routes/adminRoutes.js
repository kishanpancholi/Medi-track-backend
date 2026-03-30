// import express from "express";
// import { getAllDoctors } from "../controllers/adminController.js";
// import { protect, adminOnly } from "../middleware/authMiddleware.js";


// const router = express.Router();

// // Admin -> Get all doctors
// router.get("/doctors", protect, adminOnly, getAllDoctors);

// export default router;

import express from "express";
import { adminLogin } from "../controllers/adminController.js";

const router = express.Router();

router.post("/login", adminLogin);

export default router;