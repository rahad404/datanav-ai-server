import { chatComplete, ChatMsg } from "./llmClient";
import { IChatMessage } from "../../models/ChatMessage.model";

/**
 * Context-aware app assistant. Injects the current route and (if present)
 * the current report's analysis so answers are grounded in what the user
 * is actually looking at, plus recent conversation history for continuity.
 */
export async function getAssistantReply(params: {
   message: string;
   history: Pick<IChatMessage, "role" | "content">[];
   context: { route?: string; reportSummary?: string };
}): Promise<string> {
   const systemPrompt = `You are the in-app assistant for DataSense AI, a data-analysis platform.
Help users understand their reports, navigate the app, and answer follow-up questions.
Current page: ${params.context.route ?? "unknown"}.
${params.context.reportSummary ? `Current report summary: ${params.context.reportSummary}` : ""}
Keep answers short and actionable. If asked about navigation, give the exact route (e.g. "/items/add").`;

   const messages: ChatMsg[] = [
      { role: "system", content: systemPrompt },
      ...params.history.map((h) => ({ role: h.role, content: h.content } as ChatMsg)),
      { role: "user", content: params.message },
   ];

   return chatComplete(messages);
}

export function getSuggestedFollowUps(context: { reportSummary?: string }): string[] {
   if (context.reportSummary) {
      return [
         "What's the biggest risk in this report?",
         "Summarize the top 3 KPIs",
         "What should I do next based on this data?",
      ];
   }
   return [
      "How do I upload a new report?",
      "What file types are supported?",
      "How do I share a report publicly?",
   ];
}
