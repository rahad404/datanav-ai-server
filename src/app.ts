import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { errorHandler, notFound } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import reportsRoutes from "./routes/reports.routes";
import analysisRoutes from "./routes/analysis.routes";
import chatRoutes from "./routes/chat.routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(express.json());

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", apiLimiter);

async function ensureDb(_req: express.Request, _res: express.Response, next: express.NextFunction) {
   if (mongoose.connection.readyState !== 1) {
      try { await connectDB(); } catch (err) { return next(err); }
   }
   next();
}
app.use("/api/v1", ensureDb);

app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/reports/:id", analysisRoutes);
app.use("/api/v1/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
