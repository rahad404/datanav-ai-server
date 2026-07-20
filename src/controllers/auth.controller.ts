import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env";
import { connectDB } from "../config/db";
import { User } from "../models/User.model";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";

async function ensureDb(): Promise<mongoose.mongo.Db> {
   if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return mongoose.connection.db;
   }
   await connectDB();
   if (!mongoose.connection.db) throw new ApiError("Database not connected", 500);
   return mongoose.connection.db;
}

/**
 * POST /api/auth/jwt
 *
 * Bridges a Better Auth session (created by the Next.js frontend) into a
 * short-lived JWT this Express API can verify on every request.
 *
 * Better Auth stores sessions in a `session` collection on the SAME MongoDB
 * instance (shared with the frontend): { token, userId, expiresAt, ... }.
 * We look the session up directly rather than re-implementing auth here.
 */
export const bridgeSessionToJwt = asyncHandler(async (req: Request, res: Response) => {
   const { sessionToken } = req.body as { sessionToken?: string };
   if (!sessionToken) throw new ApiError("sessionToken is required", 400);

   const db = await ensureDb();
   const sessionDoc = await db.collection("session").findOne({ token: sessionToken });

   if (!sessionDoc || new Date(sessionDoc.expiresAt) < new Date()) {
      throw new ApiError("Session is invalid or expired", 401);
   }

   const user = await User.findById(sessionDoc.userId.toString());
   if (!user) throw new ApiError("User not found for session", 401);

   const payload = { userId: user._id.toString(), email: user.email, role: user.role };
   const expiresIn = env.ACCESS_TOKEN_EXPIRES_IN;

   const accessToken = jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn } as any);

   // Convert "15m" style string to seconds for the client's cache logic
   const expiresInSeconds = parseExpiry(expiresIn);

   res.json({ accessToken, expiresIn: expiresInSeconds });
});

function parseExpiry(value: string): number {
   const match = /^(\d+)([smhd])$/.exec(value);
   if (!match) return 900; // default 15m
   const num = Number(match[1]);
   const unit = match[2];
   const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 60;
   return num * multiplier;
}
