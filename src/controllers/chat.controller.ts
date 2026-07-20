import { Request, Response } from "express";
import { ChatMessage } from "../models/ChatMessage.model";
import { Report } from "../models/Report.model";
import { Analysis } from "../models/Analysis.model";
import { getAssistantReply, getSuggestedFollowUps } from "../services/ai/chatAgent.service";
import { asyncHandler } from "../middleware/asyncHandler";

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
   const { message, route, reportId } = req.body as { message: string; route?: string; reportId?: string };
   const userId = req.user!.userId;

   const history = await ChatMessage.find({ user: userId }).sort("-createdAt").limit(10);

   let reportSummary: string | undefined;
   if (reportId) {
      const analysis = await Analysis.findOne({ report: reportId }).sort("-createdAt");
      reportSummary = analysis?.summary;
   }

   await ChatMessage.create({ user: userId, role: "user", content: message, context: { route, reportId } });

   const reply = await getAssistantReply({
      message,
      history: history.reverse().map((h) => ({ role: h.role, content: h.content })),
      context: { route, reportSummary },
   });

   await ChatMessage.create({ user: userId, role: "assistant", content: reply, context: { route, reportId } });

   res.json({ reply, suggestions: getSuggestedFollowUps({ reportSummary }) });
});

export const getChatHistory = asyncHandler(async (req: Request, res: Response) => {
   const history = await ChatMessage.find({ user: req.user!.userId }).sort("createdAt");
   res.json(history);
});

export const clearChatHistory = asyncHandler(async (req: Request, res: Response) => {
   await ChatMessage.deleteMany({ user: req.user!.userId });
   res.json({ message: "History cleared" });
});

export const getSuggestions = asyncHandler(async (req: Request, res: Response) => {
   const { reportId } = req.query as { reportId?: string };
   let reportSummary: string | undefined;
   if (reportId) {
      const analysis = await Analysis.findOne({ report: reportId }).sort("-createdAt");
      reportSummary = analysis?.summary;
   }
   res.json({ suggestions: getSuggestedFollowUps({ reportSummary }) });
});
