// import express from "express";
// import { getAllDoctors } from "../controllers/adminController.js";
// import { protect, adminOnly } from "../middleware/authMiddleware.js";


// const router = express.Router();

// // Admin -> Get all doctors
// router.get("/doctors", protect, adminOnly, getAllDoctors);

// export default router;

import express from "express";
import { adminLogin, logoutAdmin } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/logout",logoutAdmin);

// ✅ Protected route
router.get("/dashboard",protect,authorize("admin"),(req, res) => {
    res.json({ message: "Welcome Admin Dashboard" });
  }
);

export default router;