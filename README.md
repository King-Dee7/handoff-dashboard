# AI Automated Hand-off Dashboard

An initial solution that captures voice input using a voice agent (VApi), sends structured data to n8n for it to be stored in a database(Supabase) which goes on to display the stored entries from supabase in a simple frontend

---

## Project Links

- **Live Dashboard:**  
  https://handoff-dashboard-azure.vercel.app/

- **Source Code:**  
  https://github.com/King-Dee7/handoff-dashboard

- **Automation Workflow (n8n json file):**  
  https://drive.google.com/file/d/1JORWgNCw8IEdtTytakZ3hU2CMCKOGEUP/view?usp=sharing

---

## System Architecture

Voice → Vapi → n8n → Supabase → Next.js Dashboard

### Flow Breakdown

1. **Vapi (Voice AI Intake)**
   - Captures structured hand-off data from voice input
   - Extracts structured fields using defined schema
   - Sends data via webhook

2. **n8n (Automation Layer)**
   - Receives structured webhook payload
   - Normalizes missing values
   - Inserts clean data into Supabase

3. **Supabase (Database Layer)**
   - Stores AI-generated hand-offs
   - Stores human sign-offs
   - Serves dashboard queries

4. **Next.js Dashboard**
   - Displays structured hand-off records
   - Enables internal team sign-off
   - Provides clean professional UI
   - Deployed via Vercel

---

## Problem Statement

AI assistants can extract structured data from voice conversations, but organizations require:

- Human verification  
- Accountability  
- Clear audit trails  
- Structured approval workflows  

This project introduces a Human-in-the-Loop interface that ensures:

- No lead falls through the cracks  
- Every AI-generated record is reviewed  
- Official sign-off is documented  

---

## Technical Stack

| Layer | Technology | Purpose |
|--------|------------|----------|
| Frontend | Next.js 14 (App Router) | Modern React framework |
| Styling | Tailwind CSS | Clean and rapid UI styling |
| Language | TypeScript | Type safety |
| Database | Supabase (PostgreSQL) | Relational structured storage |
| Automation | n8n | Workflow orchestration |
| Voice AI | Vapi | Voice intake + structured extraction |
| Hosting | Vercel | Continuous deployment |

---

##  Key Features

- Real-time ingestion after call completion  
- Structured data visualization  
- Human-in-the-Loop sign-off system  
- Persistent relational database storage  
- Phase tagging (Sales, Engineering, Product, etc.)  
- Clean white professional dashboard UI  
- Deployed in production via Vercel  

---

# Vapi Configuration

This section documents how the voice assistant was configured.

---

## Assistant Creation

Inside Vapi:

- Create a new Assistant
- Select preferred voice model
- Set language and voice settings
- Add structured system prompt

---

## System Prompt Behavior

The assistant is configured to:

- Ask for project phase (Sales, Solutions, Engineering, Product)
- Capture required structured fields
- Confirm missing information
- Generate structured output
- Send webhook upon call completion

---

## Structured Output Configuration

**Structured Output Name:**  
`hand_off`

**Type:**  
`Object`

### Fields Included

- phase  
- client_name  
- reported_by  
- reported_role  
- priority  
- budget  
- pain_points  
- ai_models_discussed  
- technical_constraints  
- docker_tag  
- performance_metrics  
- pilot_results  
- secret_sauce_notes  
- gpu_cost_notes  

Each field:
- Type: string  
- Required: dynamic
- Default fallback handled in n8n ("n/a")

---

## Webhook Configuration

**Method:** POST  
**Target:** n8n Webhook Endpoint  

Payload includes:
- transcript  
- summary  
- structuredOutputs  

---

# n8n Workflow Logic

1. Webhook Trigger  
2. Extract `structuredOutputs.artifact`  
3. Normalize null / missing fields  
4. Insert record into `handoffs` table  

---

# Database Schema

## Table: `handoffs`

Stores AI-generated intake data.

**Columns:**

- id (uuid)
- phase
- client_name
- reported_by
- reported_role
- priority
- budget
- pain_points
- ai_models_discussed
- technical_constraints
- summary
- raw_transcript
- created_at

---

## Table: `handoff_signoffs`

Stores human verification data.

**Columns:**

- id
- handoff_id (foreign key)
- signed_off_by
- role
- confirmed_phase
- notes
- signed_at

---

# Local Development Setup

1 Clone Repository

```bash
git clone https://github.com/King-Dee7/handoff-dashboard.git
cd handoff-dashboard



2 Inst
npm install

3️ Configure Environment Variables

Create a file named:

.env.local


Add:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
(Both of the above are available in the .env.local file)

Ensure these match the variables set in Vercel.

4 Run Development Server
npm run dev


Visit:

http://localhost:3000

