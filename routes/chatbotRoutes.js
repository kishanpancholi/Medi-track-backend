import express from "express";
import { chatWithAI, getChatHistory } from "../controllers/chatbotController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat", protect ,chatWithAI);
router.get("/history", protect, getChatHistory);
// router.delete("/clear", protect, clearChatHistory);

export default router;