# BioLoop Monitoring — SmartBin UCO & Biofuel Feedstock Dashboard

A modern full-stack web application built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase** for monitoring Used Cooking Oil (UCO) SmartBins and biofuel feedstock quality.

## Tech Stack
- **Frontend**: React 18, Next.js 14 (App Router), Tailwind CSS, Lucide React
- **Runtime**: Node.js
- **Database & Backend**: Supabase (`@supabase/supabase-js` + PostgreSQL)

## Getting Started

### 1. Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Connect Your Supabase Database (When Ready)
The app works immediately out-of-the-box with pre-seeded state matching the Figma UI (`BIN-001`, `NU Bacolod Collection Site`, `34.72 kg`, etc.).

When you are ready to connect your Supabase project:
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql) to create the tables (`bins`, `deposits`, `feedstock_assessments`, `pickup_requests`, `sensor_readings`) and seed the initial data.
3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
5. Restart `npm run dev`. The dashboard will automatically read and write live records to Supabase.
