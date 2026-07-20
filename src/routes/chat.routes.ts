import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import { sendMessage, getChatHistory, clearChatHistory, getSuggestions } from "../controllers/chat.controller";

const router = Router();

router.post("/message", verifyToken, sendMessage);
router.get("/history", verifyToken, getChatHistory);
router.delete("/history", verifyToken, clearChatHistory);
router.get("/suggestions", verifyToken, getSuggestions);

export default router;
