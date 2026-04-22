import mongoose, { Types } from "mongoose";
import Doctor from "./Doctor.js";

const reviewSchema =  new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "doctor",
        required: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    comment: {
        type: String,
    },  
},{timestamps: true})

export default mongoose.model("Review", reviewSchema);