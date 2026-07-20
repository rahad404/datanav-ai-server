import { Schema, model, Document, Types } from "mongoose";

export interface IChatMessage extends Document {
   user: string;
   role: "user" | "assistant";
   content: string;
   context: {
      route?: string;
      reportId?: string;
   };
   createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
   {
      user: { type: String, required: true, index: true },
      role: { type: String, enum: ["user", "assistant"], required: true },
      content: { type: String, required: true },
      context: {
         route: String,
         reportId: { type: Schema.Types.ObjectId, ref: "Report" },
      },
   },
   { timestamps: true }
);

export const ChatMessage = model<IChatMessage>("ChatMessage", chatMessageSchema);
