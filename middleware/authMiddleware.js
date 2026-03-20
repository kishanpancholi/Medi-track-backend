import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {// middleware it can run before the routes controller run it
  try {
    const token = req.cookies.token; // get token from cookie

    if (!token) {
      return res.status(401).json({ message: "No token, Not authorized" });// it can check if token exits or not if user is not login then the access is denied
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // it can match the token is valid, match secter key and check the token is not expire       req.user = decoded.id;

    req.user = decoded;

    next(); // without this request will hang
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
