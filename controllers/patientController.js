import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerPatient = async (req, res) => {
  try {
    const { fname, lname, gender, dob, mobile, email, address, password } =
      req.body;

    const exists = await Patient.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    //hash password
    const salt = await bcrypt.genSalt(10); // salt is use for aading the random string before the hashing It makes every password hash unique even two user use same password
    const hashedPassword = await bcrypt.hash(password, salt); // it is conver the plain password into the secure hashing password

    const patient = await Patient.create({
      fname,
      lname,
      gender,
      dob,
      mobile,
      email,
      address,
      password: hashedPassword, // this is use for storing the hase password in DB
    });

    res.status(201).json({ msg: "Patient registered successfully!", patient });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
};

//patient login
export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Patient.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email not registered" });
    }

    const isMatch = await bcrypt.compare(password, user.password); // in here bcypt takes enter password hash that password again and match that password with stored hash password in DB if match then continue otherwise give
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }
    // if (user.password !== password) {
    //   return res.status(400).json({ message: "Incorrect Password" });
    // }

    // After login we create token:
    const token = jwt.sign(
      { id: user._id },
      "secretkey123",//JWT secret key and Digitally sign the token
      { expiresIn: "1d" },
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
