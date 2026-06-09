# ClinicalScribe

An API-driven documentation tool that turns raw, unstructured clinical notes into a clean, structured SOAP note. Built as a full-stack application with a React frontend and a Node.js / Express backend that integrates a third-party LLM service for document generation.

## Architecture

```
React frontend  ──POST /api/generate──▶  Express backend  ──▶  LLM service
   (client/)        { rawNotes }            (server/)            (generates note)
       ▲                                        │
       └──────────── structured JSON ───────────┘
```

The frontend never talks to the LLM directly. It sends the raw notes to our own backend endpoint, and the backend holds the API key and makes the external call. This keeps the secret key off the client.

## Data schema

**Request** (frontend → backend):
```json
{ "rawNotes": "free-text clinical notes" }
```

**Response** (backend → frontend):
```json
{
  "chiefComplaint": "...",
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}
```

## Running it locally

You need [Node.js](https://nodejs.org) (v18 or newer) installed.

**1. Start the backend**
```bash
cd server
npm install
cp .env.example .env        # then open .env and paste in your real API key
npm run dev                 # runs on http://localhost:3001
```

**2. Start the frontend** (in a second terminal)
```bash
cd client
npm install
npm run dev                 # runs on http://localhost:5173
```

Open the frontend URL in your browser, paste in some notes (or click "Load example"), and generate.

## Project structure

```
clinicalscribe/
├── client/   React frontend (Vite)
└── server/   Node.js + Express backend
```

## Key implementation details

- **API endpoint** (`POST /api/generate`) accepts raw notes and returns a structured note.
- **Third-party integration** via the LLM service for document generation.
- **Authentication** handled server-side using an API key from an environment variable.
- **Retry logic** retries the external call up to 3 times before failing.
- **Error handling** returns appropriate HTTP status codes (400 for bad input, 502 for upstream failures).

*Demo project — not intended for real clinical use.*
