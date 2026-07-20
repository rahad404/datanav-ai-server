import { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
   status: number;
   constructor(message: string, status = 500) {
      super(message);
      this.status = status;
   }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
   console.error(err);
   if (err instanceof ApiError) {
      return res.status(err.status).json({ message: err.message });
   }
   const message = err instanceof Error ? err.message : "Internal server error";
   return res.status(500).json({ message });
}

export function notFound(_req: Request, res: Response) {
   res.status(404).json({ message: "Route not found" });
}
