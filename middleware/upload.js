// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinary.js";

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {
//     return {
//       folder: "medical-records",
//       resource_type: "auto",
//       public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
//     };
//   },
// });

// export const upload = multer({ storage });

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const originalName = file.originalname
      .replace(/\.[^/.]+$/, "") // ✅ remove extension
      .replace(/\s+/g, "_");    // clean spaces

    return {
      folder: "medical-records",
      resource_type: "auto",
      public_id: `${Date.now()}-${originalName}`, // ✅ clean name
    };
  },
});

export const upload = multer({ storage });