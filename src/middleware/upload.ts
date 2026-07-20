import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
   destination: (_req, _file, cb) => cb(null, "uploads/"),
   filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
   },
});

const allowed = [".csv", ".xlsx", ".xls", ".json"];

export const upload = multer({
   storage,
   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
   fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowed.includes(ext)) {
         return cb(new Error("Unsupported file type. Use CSV, XLSX, or JSON."));
      }
      cb(null, true);
   },
});
