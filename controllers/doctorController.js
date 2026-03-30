import Doctor from "../models/Doctor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerDoctor = async (req, res) => {
  try {
    // console.log("Doctor Form Data:", req.body);//this line is printing the submitted data in terminal 
    const {
      fullName,
      email,
      password,
    } = req.body;
    const exists = await Doctor.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const doctor = await Doctor.create({
      fullName,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ msg: "Doctor registered successfully!", doctor });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

//Doctor login 
export const loginDoctor = async (req,res) => {
  try{
    const {email, password} = req.body;

    const doc = await Doctor.findOne({email});

    if(!doc){
      return res.status(400).json({message:"Email Not Registerd"});
    }

    const isMatch = await bcrypt.compare(password, doc.password);
    if(!isMatch){
      return res.status(400).json({ message: "Incorrect Password" });
    }

    //create a json token
    const token = jwt.sign(
      {id:doc._id, role:"doctor"},
      process.env.JWT_SECRET,
      {expiresIn: "1d"},
    );

   //STORE TOKEN IN COOKIE
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // true in production (HTTPS)
      sameSite: "none",
      maxAge: 24 * 60 * 60 *1000, // 1 day
    });

    res.status(200).json({
      message: "Login Successful",
      doc,
      token,
      doctor:{
        id: doc._id,
        fullName: doc.fullName,
        email: doc.email,
        isProfileComplete: doc.isProfileComplete,
      }
    });
  }catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const logoutDoctor = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    // sameSite: "lax",
    // secure: false, // true in production
    expires: new Date(0)
  });

  res.status(200).json({ message: "Logout successful" });
};

// ✅ Get all doctors (only name + id)
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().select("fullName");

    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: error.message });
  }
};

export const completeDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const {
      gender,
      dob,
      specialization,
      qualification,
      mobile,
      profilePic,
      experience,
      licenseNumber,
      workingDays,
      workingHours,
      clinicName,
      clinicAddress,
      city,
      state,
      mapLink,
      about,
      emergencyContact,
    } = req.body;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      {
        gender,
        dob,
        specialization,
        qualification,
        mobile,
        profilePic,
        experience,
        licenseNumber,
        workingDays,
        workingHours,
        clinicName,
        clinicAddress,
        city,
        state,
        mapLink,
        about,
        emergencyContact,
        isProfileComplete: true,
      },
      { new: true, 
        runValidators: true
      }
    );

    res.status(200).json({
      message: "Profile completed successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};