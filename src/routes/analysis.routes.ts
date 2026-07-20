import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import {
   triggerAnalysis,
   regenerateAnalysis,
   getLatestAnalysis,
   getAnalysisStatus,
} from "../controllers/analysis.controller";

// Mounted at /api/v1/reports/:id/analy... — see app.ts merging with reports router
const router = Router({ mergeParams: true });

router.post("/analyze", verifyToken, triggerAnalysis);
router.post("/analyze/regenerate", verifyToken, regenerateAnalysis);
router.get("/analysis", verifyToken, getLatestAnalysis);
router.get("/analysis/status", verifyToken, getAnalysisStatus);

export default router;
