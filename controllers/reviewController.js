// POST /api/reviews
import Review from "../models/Review.js";

export const addReview = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;

    const review = await Review.create({
      doctor: doctorId,
      patient: req.user.id,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET /api/reviews/:doctorId
export const getDoctorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      doctor: req.params.doctorId,
    }).populate("patient", "name");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
