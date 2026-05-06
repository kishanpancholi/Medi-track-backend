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
  <div style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
      <tr>
        <td align="center">

          <!-- MAIN CARD -->
          <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.1);">

            <!-- HEADER (Gradient + Logo) -->
            <tr>
              <td align="center" style="padding:30px; background:linear-gradient(135deg,#0aa5a5,#2bbbad);">
                
                <!-- LOGO -->
                <img 
                  src="/Logo.png"
                  alt="MediTrack Logo" 
                  width="90" 
                  style="margin-bottom:10px;"
                />

                <h2 style="color:#ffffff; margin:0; font-weight:600;">
                  MediTrack
                </h2>

              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:30px; text-align:left; color:#333;">

                <h3 style="margin-top:0;">OTP Verification</h3>

                <p style="font-size:14px; line-height:1.6; color:#555;">
                  Hi User,
                  <br/><br/>
                  We received a request to reset your password.  
                  Use the OTP below to complete the process.
                </p>

                <!-- OTP BOX -->
                <div style="text-align:center; margin:30px 0;">
                  <span style="
                    display:inline-block;
                    background:#0aa5a5;
                    color:#ffffff;
                    font-size:30px;
                    font-weight:bold;
                    letter-spacing:6px;
                    padding:6px 9px 6px 15px;
                    border-radius:8px;
                  ">
                    ${otp}
                  </span>
                </div>

                <p style="font-size:14px; color:#555;">
                  This OTP is valid for <b>5 minutes</b>.
                </p>

                <p style="font-size:14px; color:#777;">
                  If you didn’t request this, you can safely ignore this email.
                </p>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f9f9f9; padding:20px; text-align:center; font-size:12px; color:#999;">
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