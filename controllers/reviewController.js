// POST /api/reviews
import Review from "../models/Review.js";
import { notificationMessages } from "../utils/notificationMessages.js";
import { sendNotification } from "../utils/sendNotification.js";  

export const addReview = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;
 
    const review = await Review.create({
      doctor: doctorId,
      patient: req.user.id,
      rating,
      comment,
    });
       const patientName = `${req.user.firstName} ${req.user.lastName}`;

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

// GET /api/review/:doctorId - for doctor dashboard (summary + latest 3 reviews)
export const getDoctorReviews = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const reviews = await Review.find({ doctor: doctorId })
      .populate("patient", "firstName lastName")
      .sort({ createdAt: -1 });

    // ✅ total reviews
    const totalReviews = reviews.length;

    // ✅ average rating
    const avgRating =
      totalReviews === 0
        ? 0
        : (
            reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          ).toFixed(1);

    // ✅ rating distribution
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

    // ✅ latest 3 reviews
    const latestReviews = reviews.slice(0, 3);

    // ✅ response
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

export const getAllReviews = async (req, res) => {
  try {
   // const doctorId = req.user.id; 
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .populate("patient", "firstName lastName")
      .populate("doctor", "fullName specialization");

    res.json(reviews);
  } catch (error) {
    console.log("REVIEW API ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};