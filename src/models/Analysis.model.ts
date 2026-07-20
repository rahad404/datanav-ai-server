import { Schema, model, Document, Types } from "mongoose";

export interface IAnalysis extends Document {
   report: Types.ObjectId;
   depth: "quick" | "deep";
   summary: string;
   trends: { label: string; direction: "up" | "down" | "flat"; detail: string }[];
   kpis: { name: string; value: string; change?: string }[];
   risks: { title: string; severity: "low" | "medium" | "high"; detail: string }[];
   recommendations: string[];
   rawModelOutput?: string;
   jobStatus: "queued" | "processing" | "done" | "failed";
   createdAt: Date;
}

const analysisSchema = new Schema<IAnalysis>(
   {
      report: { type: Schema.Types.ObjectId, ref: "Report", required: true, index: true },
      depth: { type: String, enum: ["quick", "deep"], default: "quick" },
      summary: String,
      trends: [
         {
            label: String,
            direction: { type: String, enum: ["up", "down", "flat"] },
            detail: String,
         },
      ],
      kpis: [{ name: String, value: String, change: String }],
      risks: [
         {
            title: String,
            severity: { type: String, enum: ["low", "medium", "high"] },
            detail: String,
         },
      ],
      recommendations: [String],
      rawModelOutput: String,
      jobStatus: {
         type: String,
         enum: ["queued", "processing", "done", "failed"],
         default: "queued",
      },
   },
   { timestamps: true }
);

export const Analysis = model<IAnalysis>("Analysis", analysisSchema);
