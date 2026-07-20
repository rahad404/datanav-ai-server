import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthPayload {
   userId: string;
   email: string;
   role: "user" | "admin";
}

declare global {
   namespace Express {
      interface Request {
         user?: AuthPayload;
      }
   }
}

/**
 * Verifies the short-lived JWT issued by POST /api/auth/jwt.
 * All protected domain routes (reports, analysis, chat) sit behind this.
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
   const header = req.headers.authorization;
   if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
   }

   const token = header.split(" ")[1];

   try {
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AuthPayload;
      req.user = decoded;
      next();
   } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
   }
}

/** Optional variant — attaches req.user if present, but never blocks the request */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
   const header = req.headers.authorization;
   if (header?.startsWith("Bearer ")) {
      try {
         req.user = jwt.verify(header.split(" ")[1], env.ACCESS_TOKEN_SECRET) as AuthPayload;
      } catch {
         // ignore invalid token for optional auth
      }
   }
   next();
}

export function requireRole(...roles: AuthPayload["role"][]) {
   return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
         return res.status(403).json({ message: "Forbidden" });
      }
      next();
   };
}
