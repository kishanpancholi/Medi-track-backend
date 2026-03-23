import jwt from "jsonwebtoken";

// export const protect = (req, res, next) => {// middleware it can run before the routes controller run it
//   try {
//     const token = req.cookies.patientToken || req.cookies.doctorToken; // get token from cookie

//     if (!token) {
//       return res.status(401).json({ message: "No token, Not authorized" });// it can check if token exits or not if user is not login then the access is denied
//     }
//     const decoded = jwt.verify(token, process.env.JWT_SECRET); // it can match the token is valid, match secter key and check the token is not expire       req.user = decoded.id;

//     req.user = decoded.id;
//     req.role = decoded.role;

//     next(); // without this request will hang
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid token" });
//   }
  
// };

// export const authorize = (role) => {
//   return (req, res, next) => {
//     if (req.role !== role) {
//       return res.status(403).json({ message: "Access Denied" });
//     }
//     next();
//   };
// };

export const protectPatient = (req, res, next) => {
  try {

    console.log("Cookies:", req.cookies);
    const token = req.cookies.patientToken;

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "patient") {
      return res.status(403).json({ message: "Access Denied" });
    }

    console.log("Decoded Token:", decoded);
    req.user = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const protectDoctor = (req, res, next) => {
  try {
    const token = req.cookies.doctorToken;

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "doctor") {
      return res.status(403).json({ message: "Access Denied" });
    }

    req.user = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
