import express from "express";
import { addReview, getDoctorReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router()

router.post("/", protect, authorize("patient"),addReview);
router.get("/:doctorId", protect, authorize("doctor"),getDoctorReviews);

export default router;