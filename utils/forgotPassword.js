import bcrypt from "bcryptjs";
import { sendEmail } from "../config/email.js";

export const sendOtpService = async (Model, email) => {
  const user = await Model.findOne({ email });

  if (!user) {
    throw new Error("Email not registered");
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  user.otp = otp;
  user.otpExpire = Date.now() + 5 * 60 * 1000;

  await user.save();

  await sendEmail(
    email,
    "OTP Verification",
    `Your OTP is ${otp}`
  );

  return true;
};

export const verifyOtpService = async (Model, email, otp) => {
  const user = await Model.findOne({ email });

  if (!user || user.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  if (user.otpExpire < Date.now()) {
    throw new Error("OTP expired");
  }

  return true;
};

export const resetPasswordService = async (Model, email, otp, password) => {
  const user = await Model.findOne({ email });

  if (!user || user.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  if (user.otpExpire < Date.now()) {
    throw new Error("OTP expired");
  }

  user.password = await bcrypt.hash(password, 10);
  user.otp = null;
  user.otpExpire = null;

  await user.save();

  return true;
};