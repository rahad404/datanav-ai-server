import { Router } from "express";
import { verifyToken, attachUserIfPresent } from "../middleware/verifyToken";
import { upload } from "../middleware/upload";
import {
   listPublicReports,
   getReportById,
   getRelatedReports,
   createReport,
   listMyReports,
   updateReport,
   deleteReport,
} from "../controllers/reports.controller";

const router = Router();

router.get("/", listPublicReports);
router.get("/mine", verifyToken, listMyReports);
router.get("/:id", attachUserIfPresent, getReportById);
router.get("/:id/related", getRelatedReports);

router.post("/", verifyToken, upload.single("file"), createReport);
router.patch("/:id", verifyToken, updateReport);
router.delete("/:id", verifyToken, deleteReport);

export default router;
