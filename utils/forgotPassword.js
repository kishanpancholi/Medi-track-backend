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

  // await sendEmail(
  //   email,
  //   "OTP Verification",
  //   `Your OTP is ${otp}`
  // );

  const htmlTemplate = `
  <div style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
      <tr>
        <td align="center">
          
          <!-- Card Container -->
          <table width="420" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; padding:30px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h2 style="margin:0; color:#333;">OTP Verification</h2>
              </td>
            </tr>

            <!-- Message -->
            <tr>
              <td align="center" style="color:#555; font-size:15px; line-height:1.5;">
                We received a request to reset your password.<br/>
                Use the OTP below to proceed.
              </td>
            </tr>

            <!-- OTP Box -->
            <tr>
              <td align="center" style="padding:25px 0;">
                <div style="
                  display:inline-block;
                  background:#0aa5a5;
                  color:#ffffff;
                  font-size:30px;
                  font-weight:bold;
                  letter-spacing:10px;
                  padding:7px 9px 7px 16px;
                  border-radius:8px;
                ">
                  ${otp}
                </div>
              </td>
            </tr>

            <!-- Expiry -->
            <tr>
              <td align="center" style="color:#777; font-size:14px;">
                This OTP is valid for <b>5 minutes</b>.
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:20px 0;">
                <hr style="border:none; border-top:1px solid #eee;" />
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="color:#999; font-size:12px; line-height:1.5;">
                If you did not request this, you can safely ignore this email.<br/>
                <br/>
                © 2026 MediTrack. All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </div>
`;

await sendEmail(email, "OTP Verification", htmlTemplate);

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