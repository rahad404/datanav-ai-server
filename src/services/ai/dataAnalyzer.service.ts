import { chatComplete } from "./llmClient";
import { ParsedDataset } from "../fileParser.service";

export interface AnalysisResult {
   summary: string;
   trends: { label: string; direction: "up" | "down" | "flat"; detail: string }[];
   kpis: { name: string; value: string; change?: string }[];
   risks: { title: string; severity: "low" | "medium" | "high"; detail: string }[];
   recommendations: string[];
}

/**
 * Turns a parsed dataset into a structured AI analysis.
 * We do a cheap statistical pre-pass (columns + numeric ranges) and hand
 * that to the model instead of the raw rows — cheaper, faster, and keeps
 * the model grounded in real numbers instead of hallucinating.
 */
export async function analyzeDataset(
   dataset: ParsedDataset,
   depth: "quick" | "deep",
   reportContext: { title: string; description: string; category: string }
): Promise<AnalysisResult> {
   const sampleRows = dataset.rows.slice(0, depth === "deep" ? 50 : 15);

   const systemPrompt = `You are a data analyst. Analyze the dataset and respond with ONLY a JSON object
matching this exact shape, no markdown, no commentary:
{
  "summary": string,
  "trends": [{ "label": string, "direction": "up"|"down"|"flat", "detail": string }],
  "kpis": [{ "name": string, "value": string, "change": string }],
  "risks": [{ "title": string, "severity": "low"|"medium"|"high", "detail": string }],
  "recommendations": [string]
}`;

   const userPrompt = `Report: ${reportContext.title} (${reportContext.category})
Description: ${reportContext.description}
Columns: ${dataset.columns.join(", ")}
Row count: ${dataset.rowCount}
Numeric summary: ${JSON.stringify(dataset.numericSummary)}
Sample rows: ${JSON.stringify(sampleRows)}

Analysis depth requested: ${depth}. ${depth === "deep" ? "Be thorough — cover every notable trend, KPI, and risk." : "Keep it concise — top 3 trends, top KPIs, top risk only."}`;

   const raw = await chatComplete(
      [
         { role: "system", content: systemPrompt },
         { role: "user", content: userPrompt },
      ],
      { json: true }
   );

   try {
      return JSON.parse(raw) as AnalysisResult;
   } catch {
      throw new Error("Model returned invalid JSON for analysis");
   }
}
