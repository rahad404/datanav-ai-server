import { Router } from "express";
import { bridgeSessionToJwt } from "../controllers/auth.controller";

const router = Router();

// POST /api/v1/auth/jwt — session -> JWT bridge, called by the frontend's api.ts
router.post("/jwt", bridgeSessionToJwt);

export default router;
