# CARE (Cognitive Adaptive Retention Engine)

> **AI-driven Work Journal & Active Recall Co-Thinking Engine for Engineers**

[![Build and Deploy to Cloud Run](https://github.com/actions/workflows/deploy.yml/badge.svg)](https://github.com/actions/workflows/deploy.yml/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-blue?logo=google-cloud)](https://cloud.google.com/run)

---

## 1. Project Overview & Mission

Modern engineering is increasingly prompt-driven, spec-driven, and agentic. While productivity has soared, engineers face an acute risk of **technical knowledge decay** and cognitive outsourcing. 

**CARE (Care Recall)** is an intelligent work journal and cognitive retention platform designed specifically for engineers and data science professionals. It bridges the gap between fast-paced AI-assisted coding and deep conceptual mastery by:
* Converting unstructured daily work logs into structured memory retention profiles.
* Tracking active recall intervals and AI reliance metrics over time.
* Providing 1-click interactive Socratic recall sessions with an AI senior engineering peer to reinforce deep understanding.

---

## 2. Architecture & Tech Stack

CARE is built with a robust, modern full-stack architecture optimized for high availability, security, and low-latency cloud deployments:

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (v4), Lucide Icons, and Motion for fluid animations.
* **Authentication**: Firebase Auth supporting Google SSO and secure Email/Password authentication.
* **Persistence & Real-Time Sync**: Cloud Firestore with robust offline memory caching and long-polling fallbacks for containerized browser environments.
* **Backend & AI Engine**: Node.js / Express server proxying secure requests via the Google GenAI SDK (`@google/genai`) powered by Gemini models.
* **Cloud Infrastructure**: Google Cloud Run (containerized deployment), Google Cloud Observability (structured JSON logging to `stderr`), and Google Secret Manager for secure credential isolation.

---

## 3. Key Features

* **Natural Work Journal Feed**: Effortlessly capture daily engineering decisions, debugging breakthroughs, and architectural notes with real-time Firestore listeners (`onSnapshot`).
* **Cognitive Retention Telemetry**: Real-time mathematical computation of time decay $T(t)$, AI reliance $A(t)$, history deficit $H(t)$, and overall memory fragility.
* **1-Click Peer Recall Sessions**: Engage in adaptive, non-evaluative Socratic dialogues with an AI senior peer that tests core concepts without generic quiz formats.
* **Secure User Data Isolation**: Zero cross-user leakage enforced at both the client application level and Firestore security rule boundaries.

---

## 4. Local Development Quickstart

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **pnpm**
* Firebase CLI (`npm install -g firebase-tools`)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/cognitive-adaptive-retention-engine.git
   cd cognitive-adaptive-retention-engine
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_GCP_PROJECT_ID=your_gcp_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
GEMINI_API_KEY=your_gemini_api_key
```

### Running the Development Server
Start the local Vite dev server on port `3000`:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 5. Database & Security Setup

CARE uses Cloud Firestore for durable, user-scoped data persistence. 

### Firestore Security Rules (`firestore.rules`)
All user journals, retention states, and recall logs are strictly isolated to the authenticated user (`request.auth.uid`):
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Deploying Security Rules
Deploy your Firestore rules via the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 6. Deployment & Cloud Run Infrastructure

CARE includes a pre-configured CI/CD pipeline (`.github/workflows/deploy.yml`) that automates container building and deployment to Google Cloud Run.

### Continuous Deployment via GitHub Actions
1. Configure the following **GitHub Secrets & Variables** in your repository settings:
   - `GCP_PROJECT_ID` (Variable or Secret)
   - `GCP_SA_KEY` (Secret containing your Google Cloud Service Account JSON key)
   - `VITE_FIREBASE_API_KEY` (Secret)
   - `VITE_GCP_PROJECT_ID` (Variable/Secret)
   - `VITE_FIREBASE_AUTH_DOMAIN` (Variable/Secret)
   - `VITE_FIREBASE_APP_ID` (Variable/Secret)
2. Push changes to the `main` branch. GitHub Actions will:
   - Automatically check for or create the Google Artifact Registry repository (`care-docker-repo`).
   - Build the production Docker image with Firebase client credentials baked in.
   - Push the image to Artifact Registry in `us-central1`.
   - Deploy the service to **Cloud Run** (`recall-care-app`).

### Secret Manager Integration
For production server-side credentials (such as AI API keys), store secrets securely in Google Cloud Secret Manager:
```bash
echo -n "YOUR_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
```
Cloud Run securely mounts these secrets at runtime using IAM service account permissions.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
