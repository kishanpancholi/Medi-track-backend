// POST /api/reviews
import Review from "../models/Review.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { notificationMessages } from "../utils/notificationMessages.js";
import { sendNotification } from "../utils/sendNotification.js";
import mongoose from "mongoose";

export const addReview = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;

    const review = await Review.create({
      doctor: doctorId,
      patient: req.user.id,
      rating,
      comment,
    });

    const stats = await Review.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: "$doctor",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // 🔥 Update doctor document
    await Doctor.findByIdAndUpdate(
      doctorId,
      {
        averageRating: stats[0]?.avgRating || 0,
        totalReviews: stats[0]?.totalReviews || 0
      },
      { new: true, runValidators: true }
    );

    const patientData = await Patient.findById(req.user.id).select("firstName lastName");
    const patientName = `${patientData.firstName} ${patientData.lastName}`;

    const notif = notificationMessages.review_added(
      patientName,
      rating
    );

    await sendNotification({
      userId: doctorId,
      role: "Doctor",
      type: "review_added",
      title: notif.title,
      message: notif.message,
      link: "/doctor/reviews",
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// show review on doctor side review page
export const getDoctorAllReviews = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const reviews = await Review.find({
      doctor: doctorId,
    })
      .populate("patient", "firstName lastName")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const avgRating =
      totalReviews > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    const ratingCount = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    res.json({
      avgRating,
      totalReviews,
      ratingCount,
      allReviews: reviews,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/review/:doctorId - for doctor dashboard (summary + latest 2 reviews)
export const getDoctorReviews = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const reviews = await Review.find({ doctor: doctorId })
      .populate("patient", "firstName lastName")
      .sort({ createdAt: -1 })

    // total reviews
    const totalReviews = reviews.length;

    // average rating
    const avgRating =
      totalReviews === 0
        ? 0
        : (
          reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        ).toFixed(1);

    // rating distribution
    const ratingCount = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((r) => {
      ratingCount[r.rating] += 1;
    });

    // latest 2 reviews
    const latestReviews = reviews.slice(0, 2);

    // response
    res.json({
      totalReviews,
      avgRating,
      ratingCount,
      latestReviews,
      allReviews: reviews, // for "view all"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// to get review on patient side after clicking on view more
export const getAllReviews = async (req, res) => {
  try {
    // const doctorId = req.user.id; 
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate("patient", "firstName lastName")
      .populate("doctor", "fullName specialization");

    res.json(reviews);
  } catch (error) {
    console.log("REVIEW API ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};