import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
   await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
   console.log(`[db] connected to MongoDB (${env.MONGODB_DB_NAME})`);
}