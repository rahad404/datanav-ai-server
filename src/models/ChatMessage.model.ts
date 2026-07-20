import { Schema, model, Document, Types } from "mongoose";

export interface IChatMessage extends Document {
   user: Types.ObjectId;
   role: "user" | "assistant";
   content: string;
   context: {
      route?: string;
      reportId?: Types.ObjectId;
   };
   createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
   {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
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
