import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split(".").pop().toLowerCase();

    const originalName = file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/\s+/g, "_");

    return {
      folder: "medical-records",

      // ✅ FIX: force PDF to raw
      resource_type: ext === "pdf" ? "raw" : "image",

      // ✅ IMPORTANT: DO NOT ADD EXTENSION HERE
      public_id: `${Date.now()}-${originalName}`,
    };
  },
});
export const upload = multer({ storage });



// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinary.js";

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {

//     // ✅ DEFINE ext FIRST
//     const ext = file.originalname.split(".").pop().toLowerCase();

//     const originalName = file.originalname
//       .replace(/\.[^/.]+$/, "")
//       .replace(/\s+/g, "_");

//     return {
//       folder: "doctor-documents",

//       // ✅ NOW ext works
//       resource_type: ext === "pdf" ? "raw" : "image",

//       public_id: `${Date.now()}-${originalName}`,
//     };
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowed = ["image/jpeg", "image/png", "image/jpg","application/pdf",];

//   if (allowed.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files allowed"), false);
//   }
// };

// export const upload = multer({ storage, fileFilter });