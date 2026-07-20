# DataNav AI — Backend API Server

Express/TypeScript REST API for the DataNav AI data-analysis platform. Handles file uploads, AI-powered dataset analysis, report management, and an in-app chat assistant.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js | Server runtime |
| Framework | Express 4 | HTTP routing & middleware |
| Language | TypeScript 5 | Type-safe development |
| Database | MongoDB (Mongoose 8) | Document storage |
| Auth | JWT (`jsonwebtoken`) | Short-lived API tokens (bridged from Better Auth sessions) |
| File Upload | Multer | Multipart form handling |
| File Parsing | PapaParse (CSV), xlsx (Excel) | Structured data extraction |
| Security | Helmet, CORS, express-rate-limit | HTTP headers, origin control, rate limiting |
| LLM | OpenAI-compatible API | AI analysis & chat (Gemini, OpenAI, Groq, Ollama, etc.) |
| Dev Tools | Nodemon, ts-node | Hot-reload development server |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **MongoDB** instance (local or Atlas)
- An **LLM API key** (OpenAI, Gemini, Groq, Together, or a local Ollama instance)

### 1. Clone & Install

```bash
git clone <repo-url>
cd datanav-ai-server
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development

# MongoDB connection string
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<appName>
MONGODB_DB_NAME=datanav-ai

# JWT secret (any random hex string)
ACCESS_TOKEN_SECRET=<your-secret-here>
ACCESS_TOKEN_EXPIRES_IN=15m

# Comma-separated frontend origins for CORS
CORS_ORIGINS=http://localhost:3000,https://datanav-ai.vercel.app

# LLM provider config (any OpenAI-compatible API works)
LLM_PROVIDER=gemini
LLM_API_KEY=<your-api-key>
LLM_MODEL=gemini-2.5-flash
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

**Supported LLM providers** (all use OpenAI-compatible `/chat/completions` endpoint):

| Provider | `LLM_BASE_URL` | Example Model |
|----------|----------------|---------------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b-versatile` |
| Together AI | `https://api.together.xyz/v1` | `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` |
| Ollama (local) | `http://localhost:11434/v1` | `llama3` |

### 3. Run

```bash
# Development (hot-reload)
npm run dev

# Production
npm run build
npm start
```

Server starts at `http://localhost:5000`.

---

## Project Structure

```
src/
├── app.ts                  # Express app setup & route mounting
├── server.ts               # Entry point — DB connect + listen
├── config/
│   ├── db.ts               # Mongoose connection
│   └── env.ts              # Typed environment variables
├── controllers/
│   ├── auth.controller.ts  # Session → JWT bridge
│   ├── reports.controller.ts
│   ├── analysis.controller.ts
│   └── chat.controller.ts
├── middleware/
│   ├── asyncHandler.ts     # Async error wrapper
│   ├── errorHandler.ts     # Global error handler + ApiError class
│   ├── ensureDb.ts         # DB reconnection middleware (serverless cold-start)
│   ├── upload.ts           # Multer memoryStorage config (CSV/XLSX/JSON, 10MB limit)
│   └── verifyToken.ts      # JWT verification + optional auth
├── models/
│   ├── User.model.ts       # Mirrors Better Auth user collection
│   ├── Report.model.ts
│   ├── Analysis.model.ts
│   ├── ChatMessage.model.ts
│   └── RawDataset.model.ts # In-memory file parse results (serverless-safe)
├── routes/
│   ├── auth.routes.ts
│   ├── reports.routes.ts
│   ├── analysis.routes.ts  # Mounted under /reports/:id
│   └── chat.routes.ts
└── services/
    ├── fileParser.service.ts
    └── ai/
        ├── llmClient.ts            # Provider-agnostic LLM wrapper
        ├── dataAnalyzer.service.ts # Dataset → structured analysis
        └── chatAgent.service.ts    # In-app assistant
```

---

## API Documentation

All endpoints are prefixed with `/api/v1`. Protected routes require a `Bearer` token in the `Authorization` header.

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/health` | No | Returns `{ status: "ok" }` |

---

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/jwt` | No | Bridge a Better Auth session to a JWT |

**POST `/api/v1/auth/jwt`**

Exchanges a Better Auth `sessionToken` for a short-lived JWT.

```json
// Request
{ "sessionToken": "<session-token-from-frontend>" }

// Response 200
{ "accessToken": "<jwt>", "expiresIn": 900 }
```

---

### Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/reports` | No | List public analyzed reports (paginated) |
| `GET` | `/api/v1/reports/mine` | Yes | List current user's reports |
| `GET` | `/api/v1/reports/:id` | Optional | Get single report (owner or public) |
| `GET` | `/api/v1/reports/:id/related` | No | Get related reports by category |
| `POST` | `/api/v1/reports` | Yes | Upload a new report with data file |
| `PATCH` | `/api/v1/reports/:id` | Yes | Update report metadata |
| `DELETE` | `/api/v1/reports/:id` | Yes | Delete report and its file |

**GET `/api/v1/reports` — List Public Reports**

Query parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Full-text search on title/description |
| `category` | string | — | Filter: `sales`, `finance`, `marketing`, `operations`, `other` |
| `dateFrom` | ISO date | — | Filter reports created after this date |
| `dateTo` | ISO date | — | Filter reports created before this date |
| `sort` | string | `-createdAt` | Sort field (prefix `-` for descending) |
| `page` | number | `1` | Page number |
| `limit` | number | `12` | Items per page |

```json
// Response 200
{
  "items": [{ "title": "...", "category": "finance", "status": "done", ... }],
  "total": 45,
  "page": 1,
  "pages": 4
}
```

**POST `/api/v1/reports` — Upload Report**

Content-Type: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | CSV, XLSX, or JSON (max 10MB) |
| `title` | string | Yes | Report title |
| `description` | string | Yes | Report description |
| `category` | string | No | `sales`, `finance`, `marketing`, `operations`, `other` |
| `isPublic` | boolean | No | Default `false` |

```json
// Response 201
{ "_id": "...", "title": "Q4 Sales", "status": "uploaded", ... }
```

---

### Analysis

Analysis routes are nested under `/api/v1/reports/:id/`. All require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/reports/:id/analyze` | Trigger AI analysis (fire-and-forget) |
| `POST` | `/api/v1/reports/:id/analyze/regenerate` | Re-run analysis on existing report |
| `GET` | `/api/v1/reports/:id/analysis` | Get latest analysis result |
| `GET` | `/api/v1/reports/:id/analysis/status` | Poll job status |

**POST `/api/v1/reports/:id/analyze`**

```json
// Request body
{ "depth": "quick" }  // or "deep"

// Response 202
{ "message": "Analysis started", "status": "processing" }
```

**GET `/api/v1/reports/:id/analysis/status`**

```json
// Response 200
{ "status": "done" }  // "queued" | "processing" | "done" | "failed"
```

**GET `/api/v1/reports/:id/analysis`**

```json
// Response 200
{
  "summary": "Revenue increased 12% QoQ driven by enterprise sales...",
  "trends": [
    { "label": "Revenue Growth", "direction": "up", "detail": "..." }
  ],
  "kpis": [
    { "name": "Total Revenue", "value": "$1.2M", "change": "+12%" }
  ],
  "risks": [
    { "title": "Churn Risk", "severity": "high", "detail": "..." }
  ],
  "recommendations": ["Expand enterprise sales team", "..."],
  "jobStatus": "done"
}
```

---

### Chat

All chat routes require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/chat/message` | Send a message, get AI reply |
| `GET` | `/api/v1/chat/history` | Get chat history for current user |
| `DELETE` | `/api/v1/chat/history` | Clear chat history |
| `GET` | `/api/v1/chat/suggestions` | Get suggested follow-up questions |

**POST `/api/v1/chat/message`**

```json
// Request
{
  "message": "What are the top risks in my report?",
  "reportId": "<optional-report-id>",
  "route": "/reports/123"
}

// Response 200
{
  "reply": "Based on the analysis...",
  "suggestions": ["What's the biggest risk?", "Summarize the KPIs", "..."]
}
```

**GET `/api/v1/chat/suggestions?reportId=<id>`**

```json
// Response 200
{
  "suggestions": ["What's the biggest risk in this report?", "..."]
}
```

---

## Authentication Flow

This API uses a **session-to-JWT bridge** pattern:

1. The frontend authenticates via **Better Auth** (or any session-based provider) and stores sessions in the same MongoDB database.
2. The frontend calls `POST /api/v1/auth/jwt` with the Better Auth `sessionToken`.
3. The backend validates the session against the `session` collection, looks up the user, and returns a short-lived JWT (default 15 minutes).
4. All protected endpoints verify this JWT via the `Authorization: Bearer <token>` header.

**Roles**: `user` (default), `admin`. Admin can update/delete any report.

---

## File Upload

- **Supported formats**: `.csv`, `.xlsx`, `.xls`, `.json`
- **Max size**: 10 MB
- **Storage**: Files stored in-memory and saved to MongoDB `RawDataset` collection (serverless-safe — no disk writes)
- **Parsing**: CSV via PapaParse, Excel via `xlsx`, JSON parsed natively

---

## Rate Limiting

Global rate limit on all `/api/*` routes: **300 requests per 15-minute window** per IP.
