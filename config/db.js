import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const dbURI =
      "mongodb+srv://kishan:test123@cluster0.s4imkal.mongodb.net/healthcare?appName=Cluster0";
    // const dbURI = "mongodb://127.0.0.1:27017/healthcare";

    await mongoose.connect(dbURI);
    console.log("DB Connected Successfully");
  } catch (err) {
    console.log("DB Connection Error:", err);
    process.exit(1);
  }
};

export default connectDB;
