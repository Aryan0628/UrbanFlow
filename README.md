# UrbanFlow: The Integrated Civic Management Suite

**SANKALP Hackathon 2026**  
**Team:** Shreyansh Sachan | Ishwar | Aryan Gupta | Arushi Nayak

---

## Project Overview

UrbanFlow is a holistic digital infrastructure designed to bridge the gap between urban populations, municipal administration, local leaders, and field operations. Traditional city governance struggles with disconnected communication channels, fragmented data, and delayed service delivery. UrbanFlow solves this by deploying a synchronized, three-tier ecosystem powered by advanced Artificial Intelligence, real-time tracking, satellite data analytics, and decision intelligence.

The system is divided into three primary clients:
1. **Citizen Portal** — Mobile Application
2. **Administrative Command Hub** — Web Dashboard
3. **Field Workforce Interface** — Mobile/Web Task Manager

---

## Problem Statements Addressed

### Category 1 & 2 — Urban Civic Services
Citizens lack reliable, unified channels for reporting grievances, accessing safe navigation, finding employment, and coordinating community resources. Municipal systems operate in silos, leading to slow response, poor transparency, and low public trust.

### Category 3 — AI for Local Leadership, Decision Intelligence & Public Trust
Local leaders and community administrators operate at the front line of public service delivery. Public grievances, work progress, scheme data, and citizen sentiment are often scattered across verbal complaints, paper records, and social media — resulting in poor prioritization, delayed action, and declining trust.

UrbanFlow addresses this directly through its **Civic Intelligence Dashboard**: an AI-powered leadership and decision-support layer that helps local leaders understand ground realities, prioritize effectively, verify executed work, and communicate transparently using both on-ground data and digital public signals.

**Key leadership capabilities:**
- AI collection and structuring of citizen issues via voice, text, or images
- Intelligent prioritization based on urgency, impact, and recurrence
- Geo-tagged, time-stamped verification of completed work at field level
- Social media sentiment analysis for emerging issues and misinformation detection
- AI-assisted generation of official public communications and updates
- Real-time dashboards for execution status and public trust indicators

---

## Application Walkthrough

### Citizen Mobile Application

The mobile interface is designed for accessibility and rapid response, providing citizens with localized tools for reporting, safety, community engagement, and local employment.

<p align="center">
  <img src="PLACEHOLDER_IMAGE_PATH_MOBILE_HOME" width="230" alt="UrbanFlow mobile home screen showing feature cards for SisterHood, CivicConnect, StreetGig, and KindShare">
  <img src="PLACEHOLDER_IMAGE_PATH_CIVIC_CONNECT" width="230" alt="CivicConnect grievance reporting screen with image upload and AI category detection">
  <img src="PLACEHOLDER_IMAGE_PATH_SISTERHOOD" width="230" alt="SisterHood safety module showing AI-optimized safe route on map with SOS button">
  <img src="PLACEHOLDER_IMAGE_PATH_STREETGIG" width="230" alt="StreetGig dashboard showing AI-matched local job listings with distance and pay">
</p>
<p align="center">
  <em>Left to Right: Home Screen · CivicConnect Reporting · SisterHood SOS Navigation · StreetGig Dashboard</em>
</p>

---

### Web Administration Panel

The centralized hub for municipal authorities to monitor city-wide data, verify AI-triaged complaints, orchestrate resource deployment, and track public trust indicators.

<p align="center">
  <img src="PLACEHOLDER_IMAGE_PATH_ADMIN_DASHBOARD" width="45%" alt="Admin master dashboard showing grievance counts, resolution rates, and city-wide status cards">
  <img src="PLACEHOLDER_IMAGE_PATH_ADMIN_MAP" width="45%" alt="Live complaint heatmap showing active grievances across city zones with severity color coding">
</p>
<p align="center">
  <img src="PLACEHOLDER_IMAGE_PATH_GEOSCOPE" width="45%" alt="GeoScope satellite monitoring panel showing NO2 pollution hotspots and urban heat island overlays via Google Earth Engine">
  <img src="PLACEHOLDER_IMAGE_PATH_ADMIN_NGO" width="45%" alt="KindShare NGO portal showing donation inventory, NGO assignments, and pickup scheduling">
</p>
<p align="center">
  <em>Top: Master Dashboard and Live Complaint Mapping · Bottom: GeoScope Satellite Monitoring and KindShare NGO Portal</em>
</p>

---

### Civic Intelligence Dashboard — Leadership Module

Dedicated to local leaders and administrators, this module provides decision intelligence built on live civic data and social signal analysis.

<p align="center">
  <img src="PLACEHOLDER_IMAGE_PATH_LEADERSHIP_OVERVIEW" width="45%" alt="Leadership overview dashboard showing top prioritized issues ranked by AI urgency score, recurrence, and citizen impact">
  <img src="PLACEHOLDER_IMAGE_PATH_SENTIMENT_ANALYSIS" width="45%" alt="Social media sentiment analysis panel showing real-time citizen mood, trending issues, and misinformation alerts">
</p>
<p align="center">
  <img src="PLACEHOLDER_IMAGE_PATH_WORK_VERIFICATION" width="45%" alt="AI work verification screen displaying geo-tagged and time-stamped proof of task completion uploaded by field workers">
  <img src="PLACEHOLDER_IMAGE_PATH_PUBLIC_COMM" width="45%" alt="AI-assisted public communication generator with draft announcement, tone selector, and one-click publish to official channels">
</p>
<p align="center">
  <em>Top: AI Prioritization Engine and Citizen Sentiment Monitor · Bottom: Field Work Verification and AI Communication Generator</em>
</p>

---

### Staff and On-Ground Worker Interface

Dedicated views for municipal workers and first responders to receive tasks, navigate to sites, and validate job completion.

<p align="center">
  <img src="PLACEHOLDER_IMAGE_PATH_STAFF_TASK_LIST" width="45%" alt="Staff task queue screen listing assigned grievances with priority badges, distance, and navigation button">
  <img src="PLACEHOLDER_IMAGE_PATH_STAFF_RESOLUTION" width="45%" alt="Task resolution upload screen where worker submits geo-tagged photo proof which is validated by AI before marking complete">
</p>
<p align="center">
  <em>Left: Assigned Task Queue with routing · Right: AI-Validated Proof of Resolution Upload</em>
</p>

---

## Detailed Feature Breakdown

### 1. SisterHood — Advanced Protective Services
Designed for proactive and reactive personal safety, focusing on women navigating urban environments.

- **Risk-Aware Navigation:** Calculates routes by analyzing street lighting intensity, historical incident data, and real-time crowd density to suggest the safest pedestrian path.
- **Acoustic Distress Monitoring:** Uses edge computing to continuously process background audio. If specific distress patterns or high-decibel trigger words are detected, the system autonomously initiates emergency protocols without requiring physical interaction.
- **Decentralized Emergency Response:** On SOS activation, alerts go to central command (police dispatch) while simultaneously broadcasting to a community mesh of nearby verified users for immediate bystander intervention.

---

### 2. CivicConnect (EcoSnap) — Unified Grievance Reporting
Replaces the siloed approach to municipal complaints with a unified AI-triaged pipeline for waste, electricity, water, infrastructure, and fire safety issues.

- **Intelligent Pre-Screening:** On-device and backend AI agents analyze photographic evidence before a report enters the system. The AI categorizes the issue, determines severity, and filters spam or irrelevant images.
- **Automated Departmental Routing:** Verified complaints are automatically routed to the correct municipal department and assigned to the nearest available field worker.

---

### 3. GeoScope — Macro-Level Urban Intelligence
A predictive and analytical tool for city planners and environmental officers.

- **Environmental Surveillance:** Integrates directly with Google Earth Engine to monitor atmospheric pollutants (NO2, aerosols) and map pollution hotspots in real-time.
- **Thermal and Disaster Analysis:** Identifies Urban Heat Islands (UHI) and processes satellite imagery for early warnings on coastal erosion, deforestation, and flood risks.

---

### 4. StreetGig — Micro-Employment Exchange
A localized economic driver connecting daily wage workers and freelancers with immediate community needs.

- **Hyperlocal AI Matching:** Displays short-term labor opportunities to users in the immediate vicinity using geofencing and AI skill matching.
- **AI Skill Gap Analysis:** Analyzes a worker's job history and success rates to recommend specific upskilling schemes or government programs to help them transition to higher-paying work.

---

### 5. KindShare — Resource Optimization
A hyper-local logistics layer to combat urban waste and support vulnerable populations.

- **Direct-to-NGO Routing:** Connects individual donors or commercial entities with surplus food, clothing, or supplies directly to verified local NGOs.
- **Automated Coordination:** Facilitates scheduling and logistics of doorstep collection, ensuring perishable goods reach those in need efficiently.

---

### 6. Civic Intelligence Dashboard — AI Leadership Module *(Category 3)*
An AI-powered decision-support system that transforms fragmented civic data into actionable leadership intelligence.

- **AI Issue Structuring:** Citizens can submit issues via voice, text, or images. AI agents structure, classify, and deduplicate incoming data in real-time.
- **Smart Prioritization Engine:** Issues are ranked by urgency score, citizen impact radius, and recurrence frequency using ML-based ranking models.
- **Verified Work Tracking:** Field workers upload geo-tagged, time-stamped photographic proof. AI validates completion authenticity before marking tasks resolved.
- **Sentiment & Misinformation Monitoring:** Continuously scans social media signals to surface citizen sentiment trends, emerging local issues, and flag potential misinformation for leader review.
- **AI Communication Generator:** Helps leaders draft verified, factual public announcements in seconds — with tone control and direct publish to official channels.
- **Trust Indicator Dashboard:** Aggregates grievance resolution rates, sentiment scores, and scheme implementation progress into a real-time public trust index.

---

## Technical Architecture

UrbanFlow runs on a highly scalable microservices architecture designed for high availability, real-time data processing, and complex AI orchestration.

### Technology Stack

| Layer | Technologies |
|---|---|
| **Citizen Mobile App** | React Native, Expo, NativeWind |
| **Web Dashboard** | React.js (Vite), Tailwind CSS, Leaflet, Google Maps |
| **Primary API** | Node.js, Express.js |
| **AI Inference Engine** | Python, FastAPI |
| **Databases** | MongoDB (primary), Firebase RTDB (real-time), Redis (caching) |
| **AI & ML** | LangChain multi-agent orchestration, Google Cloud Vertex AI, OpenAI |
| **Satellite & Geospatial** | Google Earth Engine, Google Maps Platform |
| **Storage & Media** | Cloudinary, Firebase Storage |
| **Auth & Notifications** | Firebase Authentication, Firebase Push Notifications |
| **Async Messaging** | RabbitMQ |

### AI Agent Architecture
A network of specialized LangChain agents handles different civic domains — Safety, Infrastructure, Jobs, Waste, Water, Electricity, and Leadership — each processing natural language inputs, analyzing images, and making automated routing and prioritization decisions. The Leadership agent additionally ingests social media streams for sentiment and misinformation analysis.

---

*UrbanFlow — Powered by AI. Built for people.*
