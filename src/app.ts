import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import reportsRoutes from "./routes/reports.routes";
import analysisRoutes from "./routes/analysis.routes";
import chatRoutes from "./routes/chat.routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", apiLimiter);

app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/reports", reportsRoutes);
// analysis routes are nested under /reports/:id (analyze, analysis, analysis/status)
app.use("/api/v1/reports/:id", analysisRoutes);
app.use("/api/v1/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
