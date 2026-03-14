<p align="center">
  <img src="ReadmeMedia/React_Native/Dashboard/UrbanFlow_Dashboard.jpg" width="180" alt="UrbanFlow Dashboard">
</p>

<h1 align="center">UrbanFlow</h1>
<h3 align="center">The Integrated AI-Powered Civic Management Suite</h3>

<p align="center">
  <strong>SANKALP Hackathon 2026</strong><br>
  Built by <strong>Shreyansh Sachan</strong> · <strong>Ishwar</strong> · <strong>Aryan Gupta</strong> · <strong>Arushi Nayak</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-blue?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/AI%20Engine-Multi--Agent%20LLM-blueviolet?style=for-the-badge" alt="AI Engine">
  <img src="https://img.shields.io/badge/Satellite-Google%20Earth%20Engine-success?style=for-the-badge" alt="GEE">
  <img src="https://img.shields.io/badge/Realtime-Firebase%20RTDB-orange?style=for-the-badge" alt="Firebase">
</p>

---

> **UrbanFlow** is a production-grade, AI-first civic operating system that transforms the relationship between citizens, municipal administration, local leaders, and field operations. It deploys a synchronized, three-tier ecosystem driven by **Large Language Models**, **multi-agent AI orchestration**, **real-time streaming**, **computer vision**, **satellite analytics**, and **geospatial intelligence**.

---

## System Workflow — End-to-End Architecture

```mermaid
graph TB
    subgraph CITIZENS["CITIZEN LAYER — React Native Mobile App"]
        C1["SisterHood<br/>AI Safe Routes · Acoustic SOS"]
        C2["CivicConnect<br/>AI Grievance Reporting"]
        C3["StreetGig<br/>AI Job & Skill Gap Analysis"]
        C4["KindShare<br/>AI NGO Coordination"]
        C5["UrbanConnect<br/>Civic Forum · AI Fact-Check"]
    end

    subgraph AI["AI Engine (Python / FastAPI)"]
        direction TB
        A1[Multi-Agent Orchestration]
        A2[Vision AI]
        A3[NLP Pipeline]
        A4[Embedding Engine]
        A5[Whisper STT]
    end

    subgraph ADMIN["ADMIN LAYER — React.js Web Dashboard"]
        AD1["Operational Dashboard<br/>Central Command Systems"]
        AD2["Complaint Heatmap<br/>Geohash-Clustered Severity Map"]
        AD3["GeoScope<br/>Satellite Environmental Intelligence"]
        AD4["Civic Analytics<br/>Sentiment · Clusters · Misinformation"]
        AD5["Staff Management<br/>Task Assignment · Work Verification"]
    end

    subgraph DATA["DATA LAYER"]
        D1["MongoDB<br/>(Documents + Vector Search)"]
        D2["Firebase RTDB<br/>(Sub-100ms Real-time)"]
        D3["Firestore<br/>(Geohash Spatial Index)"]
        D4["Redis<br/>(Cache + Rate Limiting)"]
        D5["Cloudinary<br/>(Media CDN)"]
    end

    subgraph FIELD["FIELD WORKER LAYER"]
        F1["AI-Prioritized Task Queue"]
        F2["GPS-Verified Photo Proof"]
        F3["AI Resolution Validation"]
    end

    CITIZENS -->|"REST / WebSocket"| AI_ENGINE
    AI_ENGINE -->|"Structured Intelligence"| ADMIN
    ADMIN -->|"Task Assignment via RTDB"| FIELD
    FIELD -->|"AI-Verified Resolution"| AI_ENGINE
    AI_ENGINE <-->|"Read / Write"| DATA
    CITIZENS -->|"SOS · Live Tracking"| DATA
```

---

## Problem Statements Addressed

### Urban Civic Services
Citizens lack unified, intelligent channels for reporting grievances, accessing safe navigation, finding employment, and coordinating community resources. Municipal systems operate in silos with no AI layer to triage, route, or verify work — resulting in slow response, low transparency, and poor outcomes.

### AI for Local Leadership, Decision Intelligence & Public Trust
Local leaders operate at the front line of service delivery, yet grassroots governance processes remain fragmented and unstructured. UrbanFlow's **Civic Intelligence Dashboard** directly addresses this with:

- AI-powered structuring of citizen issues from voice, text, image, and social media inputs
- Intelligent issue prioritization using ML-based urgency, impact, and recurrence scoring
- AI-validated geo-tagged, time-stamped verification of field work completion
- NLP pipelines for social media sentiment and misinformation detection
- AI-assisted generation of verified public communications
- Real-time dashboards exposing execution status and citizen trust indicators

---

## Application Walkthrough

### Citizen Mobile Application

The mobile interface is designed for accessibility and rapid response, enabling citizens to interact with AI-powered civic tools from a single unified surface.

<p align="center">
  <img src="ReadmeMedia/React_Native/Dashboard/UrbanFlow_Dashboard.jpg" width="200" alt="UrbanFlow Dashboard">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/Notification.jpg" width="200" alt="Real-time Resolution Notifications">
</p>
<p align="center">
  <em>Left: Dashboard Home with feature cards (SisterHood, CivicConnect, StreetGig, KindShare, UrbanConnect) · Right: Real-time notification feed showing grievance resolution updates</em>
</p>

---

### Web Administration Panel

The centralized command hub where municipal authorities leverage AI-generated summaries, anomaly alerts, live maps, and satellite data to orchestrate city operations.

<p align="center">
  <img src="ReadmeMedia/Administration/Admin_Panel.png" width="90%" alt="CityAdmin Operational Dashboard showing Central Command Systems: GeoScope, Women Safety, AI Safety Audits, Native SOS Command, Civic Analytics — with Departmental Operations: Infrastructure, Water Supply, Smart Waste, Electricity, Fire & Safety">
</p>
<p align="center">
  <em>Operational Dashboard — Central Command Systems with live status indicators and Departmental Operations overview</em>
</p>

<p align="center">
  <img src="ReadmeMedia/Administration/ComplaintMap/Screenshot_2026-03-14_at_9.29.41_PM.png" width="45%" alt="Complaint heatmap view 1 — geohash-clustered grievance pins on a city map">
  &nbsp;
  <img src="ReadmeMedia/Administration/ComplaintMap/Screenshot_2026-03-14_at_9.29.57_PM.png" width="45%" alt="Complaint heatmap view 2 — zoomed-in severity-coded complaint clusters">
</p>
<p align="center">
  <em>Live Complaint Heatmap — Geohash-clustered grievances with AI-determined severity, filterable by department and date range</em>
</p>

---

### GeoScope — Satellite Intelligence Panel

<p align="center">
  <img src="ReadmeMedia/Administration/GEE/GEE_analysis_options.png" width="45%" alt="GeoScope Environmental Monitoring module selector — Deforestation, Fire Alert, Coastal Erosion, Flood Watch, Air Pollutants, Surface Heat">
  &nbsp;
  <img src="ReadmeMedia/Administration/GEE/GEE_report.png" width="45%" alt="Flood Analysis Report showing SAR radar baseline vs detected flood extent with inundated area calculation and Sentinel-1 pass dates">
</p>
<p align="center">
  <em>Left: Environmental Monitoring module selector (6 analysis types powered by Google Earth Engine) · Right: Flood Analysis Report using Sentinel-1 SAR data with radar baseline vs. detected flood extent</em>
</p>

---

### Civic Intelligence Dashboard — AI Leadership Module

A dedicated AI decision-support surface for local leaders and administrators, surfacing ground realities from both citizen-reported data and civic social media signals.

<p align="center">
  <img src="ReadmeMedia/Administration/Social_Media_AI_overview.png" width="90%" alt="Civic Analytics dashboard showing Analyzed Posts count, Average Sentiment score, Emerging Clusters, Misinformation count, Sentiment Distribution bars, Emerging Issues with cluster IDs, Misinformation Feed with flagged posts and AI Context Notes, and Analyzed Posts table with sentiment/urgency/type/cluster metadata">
</p>
<p align="center">
  <em>Civic Analytics — Real-time sentiment distribution, emerging issue clusters, misinformation detection with AI-generated context notes, and a per-post analysis table</em>
</p>

---

### Staff & Field Worker Management

<p align="center">
  <img src="ReadmeMedia/Administration/Staff_Panel/Admin_Assigned_Staff_work.png" width="32%" alt="Smart Waste — Needs Action queue showing AI-verified high-priority complaint with photo, description, and Assign Team button">
  &nbsp;
  <img src="ReadmeMedia/Administration/Staff_Panel/Admin_choose_staff.png" width="32%" alt="Task Assignment panel showing available staff with proximity, task title pre-filled from AI analysis, priority level, auto-deadline, and Confirm Assignment button">
  &nbsp;
  <img src="ReadmeMedia/Administration/Staff_Panel/AdminResolvedwork.png" width="32%" alt="Smart Waste — Resolved tab showing completed tasks with AI-generated descriptions and resolution status">
</p>
<p align="center">
  <em>Left: AI-triaged complaint queue (Needs Action) · Center: Staff assignment panel with proximity ranking and AI-generated task details · Right: Resolved complaints with AI verification</em>
</p>

<p align="center">
  <img src="ReadmeMedia/Administration/StaffWork/Screenshot_2026-03-14_at_9.49.35_PM.png" width="90%" alt="Staff work overview panel">
</p>
<p align="center">
  <em>Staff Work Overview — Track assigned, in-progress, and completed tasks across all field workers</em>
</p>

---

### Women Safety — Police Command Panel

<p align="center">
  <img src="ReadmeMedia/Administration/Woman_safety/Police_Panel_for_women_safety.png" width="90%" alt="Police Panel for Women Safety — Live SOS Tracking with Active Signals, Voice SOS Recordings, live Google Maps view with SOS pin, AI Summary of distress pattern, and recommended actions">
</p>
<p align="center">
  <em>Live SOS Command — Active distress signals on map, Voice SOS recordings with AI-generated summaries, distress pattern detection, and recommended emergency actions</em>
</p>

---

## Detailed Feature Breakdown

### 1. SisterHood — AI-Powered Personal Safety & Emergency Response

SisterHood is a real-time safety platform built on continuous AI inference and decentralized emergency coordination, primarily targeting women navigating urban environments.

<p align="center">
  <img src="ReadmeMedia/React_Native/SisterHood/SisterHood_Home.jpg" width="200" alt="SisterHood home screen with safety-scored route map, risk heatmap overlay, and SOS button">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/SisterHood/SisterHood_SOS_Triggered.jpg" width="200" alt="SisterHood SOS triggered — Securing Perimeter mode active, SOS Alert Nearby banner showing ~5m distance, dark map with alert pin, Record and Call buttons">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/SisterHood/SisterHood_SOS_Detrigger.jpg" width="200" alt="SisterHood SOS Deactivated dialog — Was this a false alarm? with Yes, False Alarm and No — Real Emergency options">
</p>
<p align="center">
  <em>Left: AI safe route with risk heatmap · Center: SOS triggered — Securing Perimeter with nearby alert broadcast · Right: SOS deactivation with false alarm feedback loop</em>
</p>

#### Technical Deep-Dive

| Component | Technology | Implementation |
|---|---|---|
| **Safe Route Engine** | Modified Dijkstra's, Google Maps Platform | Multi-factor safety index: historical incident heatmaps, crowd density, street lighting from satellite imagery, time-of-day risk modifiers. Optimizes for safety-weighted cost, not pure distance. |
| **Acoustic Distress Monitor** | TensorFlow Lite (on-device) | 16kHz mic input, 3-second sliding buffer, confidence scoring every second. Trained on labeled distress vocalizations. Zero-interaction SOS trigger on sustained high confidence. |
| **Emergency Network** | Firebase RTDB, FCM, REST API | Parallel SOS: (1) Backend + police dispatch via RTDB, (2) geofenced push notifications to community responders, (3) live tracking for trusted contacts. |
| **Companion Matching** | Vector similarity on route segments | Matches verified users traveling same route within ±10-min departure window. Opt-in real-time coordination. |

---

### 2. CivicConnect (EcoSnap) — AI-Triaged Unified Grievance Reporting

CivicConnect replaces siloed municipal complaints with a fully AI-automated pipeline covering waste management, electricity faults, water supply, road infrastructure, and fire safety.

<p align="center">
  <img src="ReadmeMedia/React_Native/civic_connect/Report_Submission.jpeg" width="200" alt="CivicConnect AI grievance reporting screen with camera upload and auto-generated issue classification">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/civic_connect/AI_Verification.jpeg" width="200" alt="AI verification screen showing uploaded photo proof with GPS validation and authenticity scoring">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/civic_connect/Resolution_timeline.jpeg" width="200" alt="Resolution timeline showing complaint lifecycle from submission to AI-verified resolution">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/civic_connect/Resolution_Verification.jpeg" width="200" alt="Resolution verification — field worker uploads geo-tagged photo proof, AI validates content match and location">
</p>
<p align="center">
  <em>Left to Right: AI Grievance Report Submission · AI Photo Verification · Resolution Timeline · Field Worker Resolution Proof Upload</em>
</p>

#### AI Pipeline Architecture

```mermaid
graph LR
    A["Citizen Upload<br/>(Image + Text + Voice)"] --> B["Vision-Language AI<br/>(Vertex AI)"]
    B --> C["Auto-Classification<br/>Type / Severity / Impact"]
    C --> D{"Spam Filter Pipeline"}
    D -->|Stage 1| E["Image Relevance<br/>Classifier"]
    D -->|Stage 2| F["Duplicate Detection<br/>(Hash + Embedding)"]
    D -->|Stage 3| G["Quality Scoring"]
    E --> H["Verified Complaint"]
    F --> H
    G --> H
    H --> I["Auto-Route to Dept<br/>(Multi-label)"]
    I --> J["Nearest Worker<br/>(Spatial Index)"]
    J --> K["Firebase RTDB Push"]
```

#### Technical Deep-Dive

| Component | Technology | Implementation |
|---|---|---|
| **Multimodal Intake** | Vertex AI (Vision-Language), OpenAI Whisper | Joint image + text analysis extracts: issue type, severity (1–5), impact area, plain-English description. Voice to text via Whisper. |
| **Spam Filtering** | Binary classifier, perceptual hashing, NLP embeddings | 3-stage: (1) non-civic image rejection, (2) near-duplicate merging via hash + embedding similarity, (3) quality threshold enforcement. |
| **Department Routing** | Multi-label classification model | Auto-routes to sanitation / electricity / road / fire / water. Queries spatial index for nearest available worker. |
| **AI Resolution Verification** | Computer Vision, GPS metadata, timestamp validation | Before/after spatial consistency: GPS match, timestamp authenticity, visual similarity confirming issue no longer present. |

---

### 3. GeoScope — AI-Augmented Satellite Environmental Intelligence

GeoScope is a macro-scale environmental monitoring system built on **Google Earth Engine's** petabyte-scale satellite data infrastructure, extended with custom AI inference pipelines.

<p align="center">
  <img src="ReadmeMedia/Administration/GEE/GEE_analysis_options.png" width="45%" alt="GeoScope module selector — 6 environmental analysis modules">
  &nbsp;
  <img src="ReadmeMedia/Administration/GEE/GEE_report.png" width="45%" alt="GeoScope Flood Analysis Report with SAR radar data">
</p>
<p align="center">
  <em>Left: 6-module environmental analysis suite · Right: Live Flood Analysis using Synthetic Aperture Radar (Sentinel-1)</em>
</p>

#### Technical Deep-Dive

| Module | Data Source | AI Processing |
|---|---|---|
| **Air Pollutants** | Sentinel-5P (SO₂, NO₂, CO, Aerosol) | Interpolated pollution density maps at 1km² resolution. AI-generated anomaly commentary. |
| **Surface Heat (UHI)** | Landsat-8 Thermal IR | Split-Window Algorithm for LST. AI segmentation identifies urban heat islands vs. baseline. |
| **Flood Watch** | Sentinel-1 SAR | Multi-temporal SAR change detection for surface water expansion. Cloud-penetrating. |
| **Deforestation** | NDVI differential analysis | Localized deforestation event detection between satellite acquisition cycles. |
| **Fire Alert** | MODIS / VIIRS active fire data | Real-time active fire detection and burn area analysis. |
| **Coastal Erosion** | Shoreline temporal analysis | Track shoreline changes and rising sea levels over time. |

---

### 4. StreetGig — AI-Matched Micro-Employment Exchange

StreetGig is a hyperlocal AI-powered labor marketplace that connects daily wage workers, freelancers, and gig workers with immediate community needs using intelligent matching and skill intelligence.

<p align="center">
  <img src="ReadmeMedia/React_Native/StreetGig/StreetGig_Normal_person.jpg" width="200" alt="StreetGig — Worker Profile Inactive state with Become a Worker registration CTA">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/StreetGig/StreetGig_Job_Reccomendation.jpg" width="200" alt="StreetGig AI job recommendations — ranked job cards with AI Match badges, distance indicators, and filter chips">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/StreetGig/StreetGig_Job_Creation.jpg" width="200" alt="StreetGig job creation — budget setting screen with preset amount chips and Worker On mode">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/StreetGig/StreetGig_Upskill.jpg" width="200" alt="StreetGig AI Career Growth — Recommended Govt. Schemes with Upgradation and Improvement tabs, showing DDU-GKY and Skill India courses with match percentages">
</p>
<p align="center">
  <em>Left to Right: Worker Registration Gate · AI Job Recommendations · Job Creation with Budget Setting · AI Career Growth with Govt. Scheme Matching</em>
</p>

#### AI Matching Architecture

```mermaid
graph TD
    WP["Worker Profile"] --> WE["Master Profile Vector<br/>(Skills + History + Feedback)"]
    JP["Job Posting"] --> JE["Job Embedding<br/>(text-embedding-3-large)"]
    WE --> CS["Cosine Similarity"]
    JE --> CS
    CS --> RANK["Composite Score<br/>(Semantic Match x Distance)"]
    RANK --> REC["Ranked Recommendations"]

    subgraph SKILL_GAP["Post-Job Skill Gap Analysis"]
        FB["Employer Feedback"] --> SGA["AI Skill Gap Agent"]
        SGA --> GAPS["Skill Gap Tags"]
        GAPS --> SCHEME["Scheme Recommender"]
        SCHEME --> GOV["150+ Govt. Schemes"]
    end
```

#### Technical Deep-Dive

| Component | Technology | Implementation |
|---|---|---|
| **Profile Vectorization** | OpenAI `text-embedding-3-large` | Skills, job history, competency signals converted to semantic vector for cosine similarity matching. |
| **Geohash Proximity** | ngeohash precision-6 (~1.2km2) | 9-cell neighborhood query via Firestore `IN` operator. O(1) spatial lookup. |
| **Skill Gap Analysis** | LangChain AI Agent | Post-job feedback processing, structured gap strings matched against 150+ govt. schemes. |
| **Employer-Side Discovery** | Background AI task | Auto-queries workers with `interestedToWork: true`, ranks by profile-job similarity. |

---

### 5. KindShare — AI-Coordinated Resource Redistribution

KindShare is a hyper-local logistics intelligence system that uses AI to eliminate resource waste and accelerate the delivery of essential goods to vulnerable populations.

<p align="center">
  <img src="ReadmeMedia/React_Native/kindshare/native/Kindshare_home.jpg" width="200" alt="KindShare home screen — Donate Items, Receive Items, My Donations, My Requests">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/kindshare/native/Kindshare_donation_window.jpg" width="200" alt="KindShare donation category selector — Clothes, Books, Medicines, Electronics, Others with location-based NGO sorting">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/kindshare/native/NGO_accepting_clothes.jpg" width="200" alt="NGOs accepting Clothes — sorted by rating and proximity">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/kindshare/native/NGO_available_items.jpg" width="200" alt="NGO available items inventory — Books at Helping Hands showing available textbooks with quantity and condition">
</p>
<p align="center">
  <em>Left to Right: KindShare Home · Donation Category Selector · NGO List (sorted by proximity & rating) · Available Items at NGO</em>
</p>

<p align="center">
  <img src="ReadmeMedia/React_Native/kindshare/web/NGO_registration.png" width="60%" alt="NGO Registration Form — Organization details, location with GPS detection, categories accepted (Clothes, Books, Medicines, Electronics, Others)">
</p>
<p align="center">
  <em>Web Portal — NGO Registration with auto-location detection and category preference selection</em>
</p>

#### Technical Deep-Dive

| Component | Technology | Implementation |
|---|---|---|
| **AI Donation Matching** | Classification model + matching agent | Item attribute extraction, shelf-life estimation for perishables, NGO matching by proximity + needs + capacity + reliability. |
| **Pickup Logistics** | Firebase Cloud Messaging, scheduling engine | Auto-generated pickup proposals based on donor/NGO availability. Volunteer coordination for large volumes. |
| **Impact Analytics** | Real-time aggregation | Meals provided, kg redistributed, CO₂ saved from waste diversion, NGO utilization rates. |

---

### 6. UrbanConnect — AI-Moderated Civic Social Layer

UrbanConnect is a structured civic discourse platform where residents discuss local issues, share information, and engage with each other — with AI moderation ensuring quality and safety.

<p align="center">
  <img src="ReadmeMedia/React_Native/UrbanConnect/UrbanConnect_feed_showing_false_infe.jpg" width="200" alt="UrbanConnect feed showing a misinformation post about Stanley Road with AI-generated Community Context correction citing official Traffic Police announcement">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/UrbanConnect/UrbanConnect_rising_issues.jpg" width="200" alt="UrbanConnect Explore — Emerging Issues showing AI-detected cluster with 3 reports">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/UrbanConnect/UrbanConnect_Announcement.jpg" width="200" alt="UrbanConnect Announcements — Official announcements from Prayagraj Administration including Traffic Police notices">
  &nbsp;&nbsp;
  <img src="ReadmeMedia/React_Native/UrbanConnect/UrbanConnect_Profile.jpg" width="200" alt="UrbanConnect Profile — User profile with Posts, Likes, and Saved tabs showing civic report submissions">
</p>
<p align="center">
  <em>Left to Right: AI Misinformation Detection with Community Context · Emerging Issue Clusters · Official Announcements · User Profile</em>
</p>

#### AI Analytics Architecture

```mermaid
graph TD
    A[User Posts on UrbanConnect] --> B[Node.js: createQuestion]
    B --> C[MongoDB: Save Question]
    B --> D["Fire-and-forget"]
    D --> E["Python Agent: /analyze-post"]
    E --> F["Node 1: Triage & Sentiment<br/>(Gemini 2.0 Flash)"]
    F --> G["Node 2: Vectorize & Cluster<br/>(768d embedding + 12h window check)"]
    G --> H{Post Type?}
    H -->|MACRO_CLAIM| I["Node 3: RAG Fact-Check<br/>(Search announcements KB → LLM verify)"]
    H -->|CIVIC_REPORT / GENERAL| J[Skip fact-check]
    I --> K[MongoDB: Update Question.aiAnalysis]
    J --> K
```

#### Data Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant NodeJS as Node.js Server
    participant Agent as Python Agent (FastAPI)
    participant MongoDB
    participant LLM as Gemini 2.0 Flash

    User->>Client: Submit Post (title, description, images)
    Client->>NodeJS: POST /api/urbanconnect/ask
    NodeJS->>MongoDB: Save Question document
    NodeJS-->>Client: 201 Created (immediate response)
    
    Note over NodeJS: Fire-and-forget
    NodeJS->>Agent: POST /analyze-post
    
    Agent->>LLM: Node 1: Triage & Sentiment
    LLM-->>Agent: {sentiment, urgency, postType}
    
    Agent->>Agent: Node 2: Generate Embedding (768d)
    Agent->>NodeJS: POST /api/urbanconnect/cluster-check
    NodeJS->>MongoDB: Query recent posts, cosine similarity
    NodeJS-->>Agent: {clusterId or null}
    
    alt postType == MACRO_CLAIM
        Agent->>NodeJS: POST /api/announcements/search
        NodeJS->>MongoDB: Vector search announcements
        NodeJS-->>Agent: Top 5 matching announcements
        Agent->>LLM: Node 3: Verify claim against official context
        LLM-->>Agent: {isMisinformation, contextNote}
    end
    
    Agent-->>NodeJS: Full analysis result
    NodeJS->>MongoDB: Update Question.aiAnalysis
```

#### Technical Deep-Dive

| Component | Technology | Implementation |
|---|---|---|
| **Triage & Sentiment** | Gemini 2.0 Flash | Classifies post type (CIVIC_REPORT, MACRO_CLAIM, GENERAL), assigns sentiment and urgency. |
| **Vectorize & Cluster** | 768d embeddings, MongoDB Vector Search | Generates embedding, checks cosine similarity against posts from last 12h to detect emerging issue clusters. |
| **RAG Fact-Check** | Vector search + LLM verification | For MACRO_CLAIM posts: searches official announcements KB, LLM verifies claim against retrieved context. |
| **Voting Integrity** | Server-side `Vote` model (userId + targetId + targetType) | One vote per user per item, enforced server-side. Toggle on re-vote. Real-time count aggregation. |

---

### 7. Civic Intelligence Dashboard — AI Decision Support for Local Leaders *(Category 3)*

The Civic Intelligence Dashboard is UrbanFlow's dedicated answer to **Category 3** — an AI-native leadership layer that transforms fragmented civic data into structured, actionable intelligence.

<p align="center">
  <img src="ReadmeMedia/Administration/Social_Media_AI_overview.png" width="90%" alt="Civic Analytics — Sentiment Distribution, Emerging Issues, Misinformation Feed, Analyzed Posts">
</p>
<p align="center">
  <em>Civic Intelligence Dashboard — Full-spectrum social media intelligence with misinformation detection, issue clustering, and per-post AI analysis</em>
</p>

#### Key Capabilities

| Capability | Description | AI Technology |
|---|---|---|
| **Multi-Modal Issue Intake** | Voice (Whisper), text (NLP), image (Vision AI) → uniform schema: location, category, severity, affected population, recurrence | OpenAI Whisper, Vertex AI, NLP Pipeline |
| **ML Prioritization Engine** | Composite score: urgency × impact radius × recurrence frequency × resource availability | Multi-factor ML model on historical civic data |
| **AI Field Verification** | GPS cross-validation, timestamp authenticity check, computer vision content validation, confidence scoring | Computer Vision, metadata forensics |
| **Sentiment Pipeline** | Continuous social media analysis: sentiment classification, LDA topic modeling, misinformation detection | NLP (LDA, BERT-class models) |
| **AI Communication Generator** | Drafts verified public announcements from live data. Tone selector: formal / empathetic / informational. Inline data citations. | LLM with system data grounding |
| **Public Trust Index** | Real-time composite: resolution rate + citizen sentiment + scheme progress. Visualized per ward and time period. | Aggregated multi-stream analytics |

---

## Technical Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  React Native Mobile App  │  React.js Web Dashboard  │  Staff PWA    │
└──────────────┬────────────────────────────┬──────────────────────────┘
               │ HTTPS / WebSocket           │ Firebase RTDB
┌──────────────▼───────────────────────────────────────────────────────┐
│                    API GATEWAY (Node.js / Express)                    │
│  Auth Middleware (Auth0 JWT)  │  Rate Limiting (Redis)               │
│  REST Endpoints  │  Event Emitters  │  Webhook Receivers             │
└─────────┬──────────────────────────────┬─────────────────────────────┘
          │ HTTP / gRPC                   │ Message Queue (RabbitMQ)
┌─────────▼────────────────────────────────────────────────────────────┐
│               AI INFERENCE ENGINE (Python / FastAPI)                  │
│  Multi-Agent Orchestration (LangChain)                               │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐   │
│  │ Safety    │ │ Infra     │ │ Jobs      │ │ Leadership /      │   │
│  │ Agent     │ │ Agent     │ │ Agent     │ │ Sentiment Agent   │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────────┘   │
│  Vision AI │ NLP Pipeline │ Embeddings │ Whisper Transcription      │
└─────────┬────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                     │
│  MongoDB (primary)  │  Firebase RTDB (real-time)  │  Redis (cache)    │
│  Firestore (spatial)│  Cloudinary (media CDN)     │                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Complete Technology Stack

### Frontend Technologies

| Technology | Version / Spec | Role in UrbanFlow | Why This Choice |
|---|---|---|---|
| **React Native** | 0.76+ with Expo SDK 52 | Citizen mobile app (Android + iOS) | Single codebase, native performance, background task execution, GPS APIs |
| **NativeWind** | v4 (Tailwind for RN) | Mobile UI styling | Utility-first styling with responsive breakpoints in React Native |
| **React.js** | 18+ (Vite bundler) | Admin web dashboard | Fast HMR, tree-shaking, data-dense table/chart rendering |
| **Tailwind CSS** | v3 | Web dashboard styling | Rapid UI prototyping with consistent design tokens |
| **Leaflet** | 1.9+ | Complaint heatmaps, geospatial overlays | Open-source, lightweight map rendering with custom tile layers |
| **Google Maps Platform** | Maps SDK, Directions API | Safe route rendering, geocoding | Industry-standard mapping with real-time traffic data |
| **Expo Router** | v3 | File-based routing for mobile | Type-safe navigation, deep linking, screen preloading |

### Backend & API Technologies

| Technology | Version / Spec | Role in UrbanFlow | Why This Choice |
|---|---|---|---|
| **Node.js** | 20 LTS | Primary API gateway | Non-blocking I/O for concurrent civic requests |
| **Express.js** | v4 | REST framework | Lightweight middleware chain, extensive ecosystem |
| **FastAPI** | 0.100+ (Python) | AI inference engine | Async Python, auto-docs, native Pydantic validation, sub-200ms response |
| **Auth0** | JWT-based | Multi-platform authentication | Managed identity with social login, MFA, role-based access |
| **Firebase Auth** | — | Mobile-native auth | Seamless React Native integration, anonymous-to-permanent upgrade |
| **RabbitMQ** | 3.12+ | Async messaging | Reliable task queues for background AI processing, notification dispatch |

### AI & Machine Learning Stack

| Technology | Version / Spec | Role in UrbanFlow | Why This Choice |
|---|---|---|---|
| **LangChain** | Python SDK | Multi-agent orchestration | ReAct prompting, tool-use pipelines, structured agent networks |
| **Google Vertex AI** | Gemini 2.0 Flash | Vision-language analysis, complaint classification | Multimodal understanding, low-latency inference |
| **OpenAI GPT-4o** | API | Skill gap inference, NL generation | State-of-the-art reasoning for complex textual analysis |
| **OpenAI Whisper** | API | Voice grievance transcription | Multilingual speech-to-text, robust to ambient noise |
| **OpenAI `text-embedding-3-large`** | 3072d vectors | Worker/job/complaint vectorization | High-dimensional semantic representation for cosine similarity |
| **TensorFlow Lite** | On-device | Acoustic distress classification | Battery-efficient on-device inference, no network dependency for SOS |
| **Google Earth Engine** | JS + Python APIs | Satellite environmental monitoring | Petabyte-scale satellite catalog, server-side computation |

### Database & Storage Layer

| Technology | Spec | Role in UrbanFlow | Why This Choice |
|---|---|---|---|
| **MongoDB** | 7.0+ with Atlas Vector Search | Primary document store, vector search | Flexible schema for nested civic documents, native vector indexing |
| **Firebase Realtime Database** | — | Sub-100ms SOS, live tracking, chat | WebSocket-based, zero-latency for life-critical signals |
| **Firestore** | — | Geohash-indexed spatial records | Composite index support, geohash `IN` queries for O(1) proximity |
| **Redis** | 7.0+ | Cache, rate limiting, sessions | In-memory speed for spatial query caching and API throttling |
| **Cloudinary** | — | Media CDN | Complaint images, profile photos, resolution proof with auto-optimization |

### Infrastructure & DevOps

| Technology | Role |
|---|---|
| **Firebase Cloud Messaging (FCM)** | Push notifications: SOS broadcasts, status updates, dispatch alerts |
| **ngeohash** | Precision-4 (~39km²) and precision-6 (~1.2km²) spatial indexing |
| **Google Maps Geocoding API** | Address ↔ coordinate resolution |
| **Expo EAS** | Over-the-air mobile updates, CI/CD builds |

---

## AI Pipeline Deep-Dives

### Multi-Agent Orchestration (LangChain)

```mermaid
graph LR
    REQ["Incoming Request"] --> RC["Routing Chain<br/>(Domain Classifier)"]
    RC -->|Safety| SA["Safety Agent<br/>SOS · Routes · Distress"]
    RC -->|Infrastructure| IA["Infra Agent<br/>Complaints · Verification"]
    RC -->|Employment| JA["Jobs Agent<br/>Matching · Skill Gaps"]
    RC -->|Governance| LA["Leadership Agent<br/>Sentiment · Prioritization"]
    
    SA --> TOOLS["Domain Tools<br/>(DB Lookups · APIs · Embeddings)"]
    IA --> TOOLS
    JA --> TOOLS
    LA --> TOOLS
    
    TOOLS --> REACT["ReAct Loop<br/>(Reason → Act → Observe → Repeat)"]
    REACT --> OUT["Grounded Decision<br/>(No Hallucination)"]
```

UrbanFlow uses LangChain to construct a network of **specialized AI agents**, each with access to domain-specific tools. Agents use **ReAct (Reasoning + Acting)** prompting patterns, enabling them to iteratively query tools, reason over intermediate outputs, and arrive at grounded decisions rather than hallucinated responses.

### Vector Embedding Architecture

All semantic matching — job-worker matching, scheme-worker matching, and complaint deduplication — is powered by **`text-embedding-3-large`** embeddings stored as Firestore Vector fields. Similarity is computed server-side using **cosine similarity in NumPy**, achieving sub-200ms inference times without a dedicated vector database.

### Geohash Spatial Indexing

| Precision | Cell Size | Use Case |
|---|---|---|
| **Geohash-4** | ~39 km² | Broad neighborhood lookup for initial candidate retrieval |
| **Geohash-6** | ~1.2 km² | Precise proximity matching for job/alert discovery |

Single-query retrieval via Firestore's `IN` operator over the **9-cell geohash neighborhood** achieves **O(1) spatial lookup complexity** without geospatial indexes.

### Real-Time Firebase Architecture

```
fireAlerts/{geohash}/{alertId}              → Geo-indexed SOS records
staff/fire/{geohash}/{truckId}/coords       → Live truck GPS coordinates
jobs/rooms/{chatRoomId}/members/{userId}    → Per-room participant tracking
userActiveAlerts/{userId}                    → Per-user alert state (deduplication)
```

All RTDB listeners are attached at the component level and cleaned up on unmount, preventing memory leaks in long-running mobile sessions.

---

## Repository Structure

```
UrbanFlow/
├── client-native/          # React Native (Expo) — Citizen mobile app
│   ├── app/                # File-based routing (Expo Router)
│   ├── components/         # Reusable UI components
│   └── services/           # API clients, Firebase configs
├── client/                 # React.js (Vite) — Admin web dashboard
│   ├── src/pages/          # Route-level page components
│   └── src/components/     # Dashboard widgets, charts, maps
├── server/                 # Node.js (Express) — API gateway
│   ├── controllers/        # Business logic handlers
│   ├── models/             # MongoDB schemas (Mongoose)
│   └── routes/             # REST endpoint definitions
├── agents/                 # Python (FastAPI) — AI inference engine
│   ├── pipelines/          # Multi-agent orchestration configs
│   └── models/             # ML model wrappers
└── ReadmeMedia/            # Screenshots and documentation assets
```

---

<p align="center">
  <strong>UrbanFlow — Every citizen action intelligently processed. Every civic decision AI-informed.</strong><br>
  <em>Built for the city of tomorrow. Shipped at SANKALP 2026.</em>
</p>
