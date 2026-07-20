import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
   const value = process.env[name];
   if (!value) throw new Error(`Missing required env var: ${name}`);
   return value;
}

export const env = {
   PORT: Number(process.env.PORT) || 5000,
   NODE_ENV: process.env.NODE_ENV || "development",

   MONGODB_URI: required("MONGODB_URI"),
   MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "datasense",

   ACCESS_TOKEN_SECRET: required("ACCESS_TOKEN_SECRET"),
   ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",

   CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
   CORS_ORIGINS: (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map(s => s.trim()),

   LLM_PROVIDER: process.env.LLM_PROVIDER || "openai",
   LLM_API_KEY: process.env.LLM_API_KEY || "",
   LLM_MODEL: process.env.LLM_MODEL || "gpt-4o-mini",
   LLM_BASE_URL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
};
