import Doctor from "../models/Doctor.js";

export const registerDoctor = async (req, res) => {
  try {
    // console.log("Doctor Form Data:", req.body);//this line is printing the submitted data in terminal 
    const {
      fullName,
      gender,
      dob,
      specialization,
      qualification,
      mobile,
      email,
      address,
      username,
      password,
    } = req.body;
    const exists = await Doctor.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const doctor = await Doctor.create({
      fullName,
      gender,
      dob,
      specialization,
      qualification,
      mobile,
      email,
      address,
      username,
      password,
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
    if (doc.password !== password) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    res.status(200).json({
      message: "Login Successful",
      doc,
    });
  }catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
