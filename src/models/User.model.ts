import { Schema, model } from "mongoose";

/**
 * Mirrors the essential fields Better Auth stores in the frontend's
 * `user` collection (same MongoDB instance). We don't manage auth here —
 * this is a read-mostly reference used to attach role/profile info to
 * domain data (reports, chat messages).
 */
export interface IUser {
   _id: string;
   email: string;
   name?: string;
   image?: string;
   role: "user" | "admin";
   createdAt: Date;
   updatedAt: Date;
}

const userSchema = new Schema<IUser>(
   {
      _id: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      name: String,
      image: String,
      role: { type: String, enum: ["user", "admin"], default: "user" },
   },
   { timestamps: true, _id: false, collection: "user" } // shares Better Auth's "user" collection
);

export const User = model<IUser>("User", userSchema);
