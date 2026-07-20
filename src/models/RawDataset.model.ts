import { Schema, model, Document } from "mongoose";

export interface IRawDataset extends Document {
   report: string;
   rows: Record<string, unknown>[];
   columns: string[];
   rowCount: number;
   numericSummary: Record<string, { min: number; max: number; avg: number }>;
   createdAt: Date;
}

const rawDatasetSchema = new Schema<IRawDataset>({
   report: { type: String, required: true, index: true, unique: true },
   rows: [{ type: Schema.Types.Mixed }],
   columns: [String],
   rowCount: Number,
   numericSummary: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const RawDataset = model<IRawDataset>("RawDataset", rawDatasetSchema);
