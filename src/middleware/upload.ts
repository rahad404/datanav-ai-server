import multer from "multer";

const allowedMime = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "application/json"];

export const upload = multer({
   storage: multer.memoryStorage(),
   limits: { fileSize: 10 * 1024 * 1024 },
   fileFilter: (_req, file, cb) => {
      if (!allowedMime.includes(file.mimetype) && !file.originalname.match(/\.(csv|xlsx|xls|json)$/i)) {
         return cb(new Error("Unsupported file type. Use CSV, XLSX, or JSON."));
      }
      cb(null, true);
   },
});
