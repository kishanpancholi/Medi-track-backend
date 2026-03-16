import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.db_URI);
    console.log("DB Connected Successfully");
  } catch (err) {
    console.log("DB Connection Error:", err);
    process.exit(1);
  }
};

export default connectDB;
