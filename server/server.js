// ============================================================================
//  ClinicalScribe — Backend API server (Node.js + Express)
// ----------------------------------------------------------------------------
//  WHAT THIS FILE DOES:
//  It starts a small web server that exposes ONE main "endpoint": /api/generate
//  The React frontend sends raw clinical notes to this endpoint. This server
//  then calls a third-party LLM service to turn those notes into a structured
//  SOAP note, and sends the structured result back to the frontend as JSON.
//
//  THE DATA SCHEMA (the "shape" of data moving between frontend and backend):
//    Request  (frontend -> backend):  { "rawNotes": "free text string" }
//    Response (backend -> frontend):  {
//        "chiefComplaint": "...",
//        "subjective":     "...",
//        "objective":      "...",
//        "assessment":     "...",
//        "plan":           "..."
//    }
// ============================================================================

import express from "express";
import cors from "cors";
import "dotenv/config"; // loads variables from the .env file into process.env

const app = express();
const PORT = process.env.PORT || 3001;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// --- Middleware (code that runs on every request before our endpoints) ---
app.use(cors());            // lets the React app (on a different port) call us
app.use(express.json());    // automatically parses incoming JSON request bodies

// ----------------------------------------------------------------------------
//  Helper: call the LLM, with RETRY LOGIC across the API boundary.
//  If the third-party service hiccups, we wait briefly and try again instead
//  of failing immediately. (This is the "retry logic" your project describes.)
// ----------------------------------------------------------------------------
async function callLLMWithRetry(rawNotes, maxRetries = 3) {
  const prompt =
    "You are a clinical documentation assistant. Convert the raw, unstructured " +
    "clinical notes below into a structured SOAP note. Respond with ONLY a JSON " +
    "object (no markdown, no backticks, no commentary) with exactly these string " +
    "keys: chiefComplaint, subjective, objective, assessment, plan. Expand " +
    "abbreviations into clear professional language.\n\nRaw notes:\n" + rawNotes;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // AUTHENTICATION: we prove who we are with our secret API key.
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      // If the service returned an error status, throw so we can retry.
      if (!response.ok) {
        throw new Error("LLM service responded with status " + response.status);
      }

      const data = await response.json();

      // The response has content blocks; pull out the text and clean it up.
      const text = data.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .replace(/```json|```/g, "")
        .trim();

      // Turn the JSON text into a real JavaScript object.
      return JSON.parse(text);
    } catch (err) {
      lastError = err;
      // Wait a moment before retrying (200ms, then 400ms, then 600ms...).
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 200));
      }
    }
  }

  // All retries failed — bubble the error up to the endpoint handler.
  throw lastError;
}

// ----------------------------------------------------------------------------
//  THE MAIN ENDPOINT:  POST /api/generate
// ----------------------------------------------------------------------------
app.post("/api/generate", async (req, res) => {
  const { rawNotes } = req.body;

  // EDGE CASE 1: empty or missing input -> respond 400 (Bad Request).
  if (!rawNotes || !rawNotes.trim()) {
    return res.status(400).json({ error: "rawNotes is required." });
  }

  // EDGE CASE 2: server isn't configured with an API key -> 500.
  if (!ANTHROPIC_API_KEY) {
    return res
      .status(500)
      .json({ error: "Server missing ANTHROPIC_API_KEY. Check your .env file." });
  }

  try {
    const structuredNote = await callLLMWithRetry(rawNotes);
    return res.json(structuredNote); // success -> send the structured note back
  } catch (err) {
    console.error("Generation failed:", err.message);
    // EDGE CASE 3: the third-party service failed even after retries -> 502.
    return res
      .status(502)
      .json({ error: "Could not generate the note. Please try again." });
  }
});

// A simple health-check endpoint — handy for confirming the server is alive.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`ClinicalScribe backend running on http://localhost:${PORT}`);
});
