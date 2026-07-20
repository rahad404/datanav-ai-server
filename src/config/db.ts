import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
   try {
      await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
      console.log(`[db] connected to MongoDB (${env.MONGODB_DB_NAME})`);
   } catch (err) {
      console.error("[db] connection failed:", err);
      process.exit(1);
   }
}