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

  const htmlTemplate = `
<div style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">

        <!-- MAIN CARD -->
        <table
          width="520"
          cellpadding="0"
          cellspacing="0"
          style="
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 6px 20px rgba(0,0,0,0.1);
          "
        >

          <!-- HEADER -->
          <tr>
            <td
              align="center"
              style="
                padding:25px 30px;
                background:linear-gradient(135deg,#0aa5a5,#2bbbad);
              "
            >

              <table cellpadding="0" cellspacing="0" border="0">
                <tr>

                  <!-- LOGO -->
                  <td style="vertical-align:middle;">
                    <img
                      src="https://res.cloudinary.com/duixsebva/image/upload/v1778470664/LogoP_rchswr.png"
                      alt="MediTrack Logo"
                      width="65"
                      style="display:block;"
                    />
                  </td>

                  <!-- SPACE -->
                  <td width="12"></td>

                  <!-- TITLE -->
                  <td style="vertical-align:middle;">
                    <h1
                      style="
                        margin:0;
                        color:#ffffff;
                        font-size:32px;
                        font-weight:700;
                        letter-spacing:0.5px;
                        font-family:Arial,sans-serif;
                      "
                    >
                      MediTrack
                    </h1>
                  </td>

                </tr>
              </table>

            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td
              style="
                padding:35px 30px;
                text-align:left;
                color:#333333;
              "
            >

              <h2
                style="
                  margin-top:0;
                  margin-bottom:15px;
                  font-size:20px;
                  color:#222222;
                "
              >
                OTP Verification
              </h2>

              <p
                style="
                  font-size:15px;
                  line-height:1.7;
                  color:#555555;
                  margin:0 0 20px 0;
                "
              >
                Hi User,
                <br /><br />
                We received a request to reset your password.
                Use the OTP below to complete the verification process.
              </p>

              <!-- OTP BOX -->
              <div style="text-align:center; margin:35px 0;">
                <span
                  style="
                    display:inline-block;
                    background:#0aa5a5;
                    color:#ffffff;
                    font-size:30px;
                    font-weight:bold;
                    letter-spacing:8px;
                    padding:12px 24px 12px 32px;
                    border-radius:10px;
                  "
                >
                  ${otp}
                </span>
              </div>

              <p
                style="
                  font-size:14px;
                  color:#555555;
                  margin-bottom:12px;
                "
              >
                This OTP is valid for <b>5 minutes</b>.
              </p>

              <p
                style="
                  font-size:14px;
                  color:#777777;
                  line-height:1.6;
                  margin:0;
                "
              >
                If you didn’t request this password reset,
                you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              style="
                background:#f9f9f9;
                padding:20px;
                text-align:center;
                font-size:12px;
                color:#999999;
                border-top:1px solid #eeeeee;
              "
            >
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