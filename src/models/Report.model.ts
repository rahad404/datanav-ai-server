import { Schema, model, Document, Types } from "mongoose";

export type ReportCategory = "sales" | "finance" | "marketing" | "operations" | "other";
export type ReportStatus = "uploaded" | "processing" | "done" | "failed";

export interface IReport extends Document {
   title: string;
   description: string;
   category: ReportCategory;
   status: ReportStatus;
   isPublic: boolean;
   owner: string;
   file: {
      originalName: string;
      path: string;
      mimeType: string;
      size: number;
   };
   rowCount?: number;
   views: number;
   createdAt: Date;
   updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
   {
      title: { type: String, required: true, trim: true },
      description: { type: String, required: true },
      category: {
         type: String,
         enum: ["sales", "finance", "marketing", "operations", "other"],
         default: "other",
      },
      status: {
         type: String,
         enum: ["uploaded", "processing", "done", "failed"],
         default: "uploaded",
      },
      isPublic: { type: Boolean, default: false },
      owner: { type: String, required: true },
      file: {
         originalName: { type: String, required: true },
         path: { type: String, default: "" },
         mimeType: { type: String, required: true },
         size: { type: Number, required: true },
      },
      rowCount: Number,
      views: { type: Number, default: 0 },
   },
   { timestamps: true }
);

reportSchema.index({ title: "text", description: "text" });
reportSchema.index({ category: 1, isPublic: 1, createdAt: -1 });

export const Report = model<IReport>("Report", reportSchema);
