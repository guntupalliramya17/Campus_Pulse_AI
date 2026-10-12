# CAMPUS PULSE AI

**Predict. Explain. Simulate. Improve.**

An AI-powered Student Success Intelligence Platform for the KPMG in India Smart Campus Analytics hackathon.

## Overview

CAMPUS PULSE AI is a comprehensive college analytics application that integrates student data, calculates explainable scores, identifies academic and placement risks, recommends interventions, simulates hypothetical outcomes, and tracks follow-ups — all running locally in the browser with no backend or external API keys required.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling (dark midnight navy theme with teal/violet accents)
- **Recharts** for data visualization
- **Lucide React** for icons
- **Browser localStorage** for demo persistence

## Setup

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run typecheck # TypeScript validation
```

## Application Structure

### Pages (9 total)

| Page | Purpose |
|------|---------|
| **Command Center** | Executive dashboard with KPIs, risk distribution, department performance, heatmap, emerging signals, priority students, and recommended actions |
| **Student Explorer** | Searchable/sortable student table with detailed profile drawer (score breakdown, trends, radar chart, timeline, intervention history) |
| **Predictive Intelligence** | Rule-based risk segmentation: declining attendance, weak assessments, placement gaps, skill mismatches, placement-ready, insufficient data |
| **Intervention Lab** | What-if simulation engine — test interventions (attendance mentoring, tutoring, coding practice, etc.) with baseline-vs-scenario comparison and multi-scenario support |
| **Resource Optimizer** | Prioritized intervention recommendation queue within faculty-hours budget — accept, assign faculty, set follow-up dates |
| **AI Campus Analyst** | Conversational interface with local rule-based query engine — 8+ supported question types with evidence and supporting data |
| **Data Integration** | CSV upload, preview, validation, column mapping, duplicate detection, sample templates, import with confirmation step |
| **Outcomes & Impact** | Track intervention status, faculty assignments, follow-up dates, before/after scores, overdue alerts |
| **Settings** | Configure score weights, placement weights, risk thresholds, faculty hours, display preferences |

### Architecture

```
src/
├── types/index.ts          # All TypeScript interfaces and defaults
├── data/synthetic.ts       # Deterministic synthetic data generator (150 students)
├── utils/
│   ├── analytics.ts        # Scoring engine, risk assessment, recommendations, aggregation
│   ├── storage.ts          # Safe localStorage persistence
│   ├── format.ts           # Display formatting utilities
│   └── cn.ts               # Class name merger
├── store/AppStore.tsx      # React context — global state, filters, analytics computation
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── FilterBar.tsx       # Reusable filter controls
│   ├── StudentProfile.tsx  # Detailed student profile modal
│   └── ui/                 # Reusable UI primitives (Card, Badge, Progress, Form, Modal, Table, KPICard)
├── pages/                  # 9 page components
├── App.tsx                 # App shell with navigation
└── main.tsx                # Entry point
```

## Scoring Assumptions

### Student Success Score (0–100)

| Component | Default Weight | How it's calculated |
|-----------|---------------|---------------------|
| Academic Performance | 30% | CGPA normalized to 0-100 (CGPA/10 × 100) |
| Attendance | 20% | Overall attendance percentage directly |
| LMS Engagement | 15% | LMS logins/week normalized (0 logins=0, 20+=100) |
| Assessment Consistency | 15% | Inverse of assessment mark variance across subjects |
| Skill Development | 10% | Average of available skill indicators (technical, communication, coding) |
| Participation & Feedback | 10% | Average of event participation, certifications, and feedback rating |

### Placement Readiness Score (0–100)

| Component | Default Weight |
|-----------|---------------|
| Aptitude | 25% |
| Coding | 25% |
| Mock Interview | 20% |
| Technical Skill | 15% |
| Communication | 10% |
| Placement Participation | 5% |

Returns null if more than 50% of weighted fields are missing.

### Risk Thresholds (configurable)

- **Low Risk**: Score ≥ 75
- **Moderate Risk**: 60–74
- **High Risk**: 45–59
- **Critical Risk**: < 45
- **Insufficient Data**: Data completeness < 50%

**These are demonstration scoring rules, not scientifically validated predictions.**

## Synthetic Data

- 150 deterministic student records generated with a fixed seed (mulberry32 PRNG)
- 6 departments, 8 semesters, 4 academic years
- 7 student archetypes: high-achiever, consistent-performer, at-risk, placement-gaps, skill-mismatch, low-engagement, data-pending
- All records marked as `isSynthetic: true`
- Data is internally consistent (assessment marks, attendance, trends align with archetype)

## Limitations

1. **Not a trained ML model**: All risk assessments and recommendations use transparent deterministic rules, not machine learning predictions. No predictive accuracy is claimed.
2. **Synthetic data only**: Demo data is synthetic and does not represent real students.
3. **Scenario estimates**: Intervention Lab results are hypothetical adjustments, not guaranteed outcomes.
4. **No causal claims**: Before-and-after score changes reflect observations, not proven intervention effects.
5. **localStorage persistence**: Data persists in the browser only. Clearing browser data resets to fresh synthetic data.
6. **Rule-based analyst**: The AI Campus Analyst uses pattern-matching rules, not a live AI model. It cannot execute arbitrary SQL or code.
