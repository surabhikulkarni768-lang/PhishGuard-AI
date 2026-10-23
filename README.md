# PhishGuard AI — AI-Powered Email Threat Detection & Digital Forensics Platform

> **College Minor Project** — Full-stack cybersecurity platform for phishing detection and email forensics.

---

## 🛡 Overview

PhishGuard AI is a complete web application that detects phishing attacks, spam, malicious links, spoofed senders, and suspicious attachments in uploaded email files or pasted email content. It provides:

- **AI-powered threat detection** via a transparent, rule-based signal pipeline (ML-ready architecture)
- **Digital forensics investigation** with header parsing, routing analysis, and evidence timelines
- **Downloadable reports** in PDF and JSON format
- **Security awareness training** with an interactive phishing quiz
- **Professional cybersecurity dashboard** with charts and analytics

---

## 📁 Project Structure

```
phishguard/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── api/               # Route handlers
│   │   │   ├── analyze.py     # POST /api/analyze
│   │   │   ├── history.py     # GET /api/history
│   │   │   ├── dashboard.py   # GET /api/dashboard/stats
│   │   │   ├── forensics.py   # GET /api/forensics/{id}
│   │   │   └── report.py      # GET /api/report/{id}
│   │   ├── core/
│   │   │   └── config.py      # Environment config
│   │   ├── db/
│   │   │   └── database.py    # SQLAlchemy async engine
│   │   ├── models/
│   │   │   └── email_analysis.py  # ORM model
│   │   └── services/
│   │       ├── detection_engine.py  # Core analysis pipeline
│   │       └── report_generator.py  # PDF/JSON report generation
│   ├── fixtures/
│   │   ├── phishing_sample.eml
│   │   ├── safe_sample.eml
│   │   └── suspicious_sample.eml
│   ├── tests/
│   │   └── test_detection.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                   # React + Vite frontend
    ├── src/
    │   ├── components/         # Shared UI components
    │   ├── lib/                # API client + utilities
    │   ├── pages/              # Route-level page components
    │   └── types/              # TypeScript type definitions
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd phishguard/backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your .env file from the example
cp .env.example .env
# (Edit .env if needed — defaults work out of the box)

# 5. Start the backend server
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory (new terminal)
cd phishguard/frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The frontend will be available at **http://localhost:5173**

> The Vite dev server proxies `/api` requests to `http://localhost:8000` automatically.

---

## 🚀 Running the Application

1. Start the **backend** (`uvicorn main:app --reload`) — terminal 1
2. Start the **frontend** (`npm run dev`) — terminal 2
3. Open **http://localhost:5173** in your browser

---

## 🧪 Testing

### Run automated detection tests

```bash
# From phishguard/backend/
cd phishguard/backend
python tests/test_detection.py
# OR with pytest:
pytest tests/test_detection.py -v
```

**Test cases cover:**
- Phishing sample (SPF fail, credential harvesting, suspicious domain) → expects `phishing`
- Safe newsletter (SPF/DKIM/DMARC pass, clean content) → expects `safe`
- Suspicious sample (brand impersonation, urgency) → expects `suspicious`
- Minimal input (just sender + subject) → expects `safe`
- Empty input (no crash) → expects valid response
- Urgency + credential language → expects risk ≥ 40
- URL extraction + suspicious TLD → expects flagged URLs
- Display-name impersonation → expects sender signal

### Test with sample email fixtures

```bash
# Analyze a phishing sample via API
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@fixtures/phishing_sample.eml"

# Analyze a safe sample
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@fixtures/safe_sample.eml"

# Paste raw content
curl -X POST http://localhost:8000/api/analyze \
  -F "raw_content=URGENT: Verify your PayPal account now. Password required." \
  -F "sender=security@paypa1.tk"
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze email content, headers, or .eml upload |
| `GET` | `/api/history` | List all analyses (paginated, filterable) |
| `GET` | `/api/history/{id}` | Get a specific analysis record |
| `GET` | `/api/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/forensics/{id}` | Full forensic investigation data |
| `GET` | `/api/report/{id}?fmt=pdf` | Download PDF report |
| `GET` | `/api/report/{id}?fmt=json` | Download JSON report |
| `GET` | `/api/health` | Health check |

---

## 🧠 Detection Engine

The detection engine (`app/services/detection_engine.py`) runs a 5-stage signal pipeline:

| Stage | Signals Detected |
|-------|-----------------|
| **Sender Analysis** | Domain mismatch, impersonation, suspicious TLDs, Reply-To anomalies |
| **Language Detection** | Urgency words, credential requests, threatening language, brand mentions |
| **URL Inspection** | Suspicious TLDs, deceptive anchor text, URL extraction |
| **Attachment Scan** | Executable extensions (.exe, .bat, .vbs, etc.) |
| **Authentication Headers** | SPF/DKIM/DMARC fail/softfail detection |

**Risk Score Formula:**
- Each signal contributes a weight (0–35 per signal)
- Signals are combined with diminishing returns: total ≤ 50 is linear; above 50, each point is worth 0.6×
- Final score is capped at 100

**Classification Thresholds:**
- `safe`: 0–29
- `suspicious`: 30–69
- `phishing`: 70+ OR auth fail OR executable attachment

### Integrating an ML Model

To integrate a trained scikit-learn model:

1. Train on a dataset (SpamAssassin, CEAS-08, TREC 2007)
2. Save with `joblib.dump(model, "phishing_model.pkl")`
3. Load in `detection_engine.py` and call `model.predict_proba([feature_vector])`
4. Replace or supplement `_compute_score()` with the ML prediction
5. Set `analysis_mode = "ml-classifier (scikit-learn)"` in the result

---

## 🔒 Security Notes

- Uploaded files and pasted content are treated as untrusted input
- File size is limited to 5 MB (configurable via `MAX_UPLOAD_SIZE_MB`)
- Attachments are never executed — only filenames are inspected
- URLs are never fetched or followed automatically
- Email content is stored locally in SQLite — never transmitted to third-party services
- Set `VIRUSTOTAL_API_KEY` to enable optional URL scanning (not implemented by default)
- Keep API keys in `.env` — never in frontend code

---

## 📊 Demo vs. Live Data

- The **Dashboard** shows a "Demo Data" banner when the backend is unreachable
- Sample demo stats are displayed for presentation without a live backend
- All actual email analyses are stored in the real SQLite database
- Reports downloaded from the UI contain real analysis results

---

## 🛠 Configuration

Edit `phishguard/backend/.env`:

```env
DATABASE_URL=sqlite+aiosqlite:///./phishguard.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_UPLOAD_SIZE_MB=5
ENABLE_DNS_CHECKS=false
VIRUSTOTAL_API_KEY=              # optional
REPORT_DIR=./reports
```

To use PostgreSQL instead of SQLite:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/phishguard
```

---

## 📦 Build for Production

```bash
# Build frontend
cd phishguard/frontend
npm run build
# Output is in dist/

# Run backend in production mode
cd phishguard/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## ⚠️ Disclaimer

This tool is an automated detection system intended for educational and demonstration purposes.
It **may produce false positives and false negatives**. Do not make irreversible security decisions
based solely on its output. Consult a qualified security professional for production use.
