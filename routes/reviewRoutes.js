import express from "express";
import { addReview, getDoctorReviews, getDoctorAllReviews,getAllReviews,submitReview,skipReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router()

router.post("/", protect, authorize("patient"),addReview);
router.get("/publicreview",getAllReviews);
// router.get("/alldoctorreview/:doctorId", getDoctorAllReviews);
router.get("/alldoctorreview", protect, authorize("doctor"), getDoctorAllReviews);// show review on review page
router.get("/:doctorId", protect, authorize("doctor"),getDoctorReviews); // show review on dashboard
router.post("/submit-review", protect, authorize("patient"),submitReview);
router.post("/skip-review", protect, authorize("patient"), skipReview);
export default router;