import React, { useState } from "react";
import { FileText, Wand2, Loader2, AlertCircle, ClipboardList } from "lucide-react";

// ClinicalScribe — turns messy, free-text clinical notes into a structured SOAP note.
//
// Note: the backend runs on port 3001, the frontend on 5173 (Vite's default),
// so pointed our request at the backend's address.
const API_BASE = "http://localhost:3001";

const EXAMPLES = [
  "pt is 54yo M, came in c/o chest tightness on and off for 3 days, worse w/ exertion, no radiation. bp 148/92, hr 88, afebrile. hx of htn, takes lisinopril. smoker 1ppd. lungs clear, heart rrr no murmur. ekg ordered, troponin pending. plan: asa given, monitor, cards consult if trop positive, counseled on smoking cessation.",
  "4yo F brought in by mom, fever 102 x2 days, pulling at R ear, fussy, decreased po intake. no vomiting. TMs: R bulging erythematous, L normal. throat mild erythema no exudate. lungs cl. dx acute otitis media. rx amoxicillin, tylenol prn, f/u 48h if no improvement.",
  "22yo M, fell during soccer, twisted R ankle ~2h ago. swelling + bruising over lateral malleolus, painful wt bearing. no numbness. distal pulses intact. xray ordered r/o fx. plan: RICE, ankle brace, crutches, ibuprofen, ortho f/u if fracture.",
  "58yo F here for routine f/u, dm2 + htn. reports fatigue, occasional blurry vision. fingerstick today 210. bp 138/86. wt up 3lb since last visit. meds metformin 1000 bid, lisinopril 10. feet: no ulcers, sensation intact. plan: increase metformin, order a1c + lipid panel, diet counseling, recheck 3mo.",
];

const SECTIONS = [
  { key: "chiefComplaint", label: "Chief Complaint" },
  { key: "subjective", label: "Subjective" },
  { key: "objective", label: "Objective" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
];

export default function App() {
  const [rawNotes, setRawNotes] = useState("");
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!rawNotes.trim()) {
      setError("Please enter some clinical notes first.");
      return;
    }
    setLoading(true);
    setError("");
    setDoc(null);

    try {
      // Send the raw notes to our backend. We send JSON, we get JSON back.
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawNotes }),
      });

      const data = await response.json();

      // If the backend returned an error status, show its message.
      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      // The backend already returns the structured object, so just use it.
      setDoc(data);
    } catch (err) {
      setError("Something went wrong: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <style>{fontImport}</style>

      <header style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>
            <ClipboardList size={22} strokeWidth={2.2} color="#0f5e57" />
          </div>
          <div>
            <h1 style={styles.title}>ClinicalScribe</h1>
            <p style={styles.subtitle}>
              Raw notes in &middot; structured documentation out
            </p>
          </div>
        </div>
      </header>

      <div style={styles.grid}>
        {/* ---------- INPUT PANEL ---------- */}
        <section style={styles.panel}>
          <div style={styles.panelHead}>
            <FileText size={16} color="#0f5e57" />
            <span style={styles.panelTitle}>Raw Clinical Notes</span>
          </div>

          <textarea
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="Paste or type unstructured clinical notes here..."
            style={styles.textarea}
          />

          <div style={styles.actions}>
            <button
              onClick={() => setRawNotes(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)])}
              style={styles.linkBtn}
              disabled={loading}
            >
              Load example
            </button>

            <button
              onClick={generate}
              style={{
                ...styles.generateBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "default" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={styles.spin} /> Generating…
                </>
              ) : (
                <>
                  <Wand2 size={16} /> Generate Note
                </>
              )}
            </button>
          </div>
        </section>

        {/* ---------- OUTPUT PANEL ---------- */}
        <section style={styles.panel}>
          <div style={styles.panelHead}>
            <ClipboardList size={16} color="#0f5e57" />
            <span style={styles.panelTitle}>Structured SOAP Note</span>
          </div>

          {error && (
            <div style={styles.error}>
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}

          {!doc && !error && !loading && (
            <p style={styles.placeholder}>
              Your structured documentation will appear here once you generate it.
            </p>
          )}

          {loading && (
            <p style={styles.placeholder}>Reading the notes and structuring them…</p>
          )}

          {doc && (
            <div>
              {SECTIONS.map((s) => (
                <div key={s.key} style={styles.docSection}>
                  <div style={styles.docLabel}>{s.label}</div>
                  <div style={styles.docText}>{doc[s.key] || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer style={styles.footer}>
        Demo build &middot; not for real clinical use
      </footer>
    </div>
  );
}

const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const styles = {
  page: {
    fontFamily: "'Hanken Grotesk', sans-serif",
    background: "#f4f2ec",
    color: "#1f2a28",
    minHeight: "100vh",
    padding: "28px 24px 40px",
    boxSizing: "border-box",
  },
  header: { maxWidth: 980, margin: "0 auto 22px" },
  logoRow: { display: "flex", alignItems: "center", gap: 14 },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #d9d4c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 30,
    fontWeight: 600,
    margin: 0,
    letterSpacing: "-0.01em",
    color: "#0f3b37",
  },
  subtitle: { margin: "2px 0 0", fontSize: 13.5, color: "#6c7370" },
  grid: {
    maxWidth: 980,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18,
  },
  panel: {
    background: "#fbfaf6",
    border: "1px solid #ddd8cb",
    borderRadius: 16,
    padding: 18,
    display: "flex",
    flexDirection: "column",
  },
  panelHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #e9e5d9",
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#0f5e57",
  },
  textarea: {
    width: "100%",
    minHeight: 220,
    resize: "vertical",
    border: "1px solid #ddd8cb",
    borderRadius: 12,
    padding: 14,
    fontSize: 14.5,
    lineHeight: 1.55,
    fontFamily: "'Hanken Grotesk', sans-serif",
    color: "#1f2a28",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#6c7370",
    fontSize: 13.5,
    textDecoration: "underline",
    textUnderlineOffset: 3,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  generateBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#0f5e57",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 18px",
    fontSize: 14.5,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  spin: { animation: "spin 1s linear infinite" },
  placeholder: { color: "#8b918e", fontSize: 14, lineHeight: 1.6, margin: "6px 0" },
  error: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    background: "#fbeceb",
    color: "#9a2b25",
    border: "1px solid #f0cfcd",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13.5,
    marginBottom: 10,
  },
  docSection: { marginBottom: 16 },
  docLabel: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#0f5e57",
    marginBottom: 4,
  },
  docText: { fontSize: 14.5, lineHeight: 1.6, color: "#2a3633" },
  footer: {
    maxWidth: 980,
    margin: "22px auto 0",
    fontSize: 12,
    color: "#9aa09d",
    textAlign: "center",
  },
};
