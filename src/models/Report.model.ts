import { Schema, model, Document, Types } from "mongoose";

export type ReportCategory = "sales" | "finance" | "marketing" | "operations" | "other";
export type ReportStatus = "uploaded" | "processing" | "analyzed" | "failed";

export interface IReport extends Document {
   title: string;
   description: string;
   category: ReportCategory;
   status: ReportStatus;
   isPublic: boolean;
   owner: Types.ObjectId;
   file: {
      originalName: string;
      storedPath: string;
      mimeType: string;
      sizeBytes: number;
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
         enum: ["uploaded", "processing", "analyzed", "failed"],
         default: "uploaded",
      },
      isPublic: { type: Boolean, default: false },
      owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
      file: {
         originalName: { type: String, required: true },
         storedPath: { type: String, required: true },
         mimeType: { type: String, required: true },
         sizeBytes: { type: Number, required: true },
      },
      rowCount: Number,
      views: { type: Number, default: 0 },
   },
   { timestamps: true }
);

reportSchema.index({ title: "text", description: "text" });
reportSchema.index({ category: 1, isPublic: 1, createdAt: -1 });

export const Report = model<IReport>("Report", reportSchema);
