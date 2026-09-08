# ProductForge AI

Research-backed digital product opportunity discovery and creation.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Exa Search API for live web evidence

## Research engine v1
The first research layer creates a six-part query plan, runs searches through a provider abstraction, stores source-level evidence in Supabase, and records the full research run/query lifecycle.

Research dimensions:
- Demand
- Pain points
- Existing solutions
- Monetization signals
- Competition gaps
- Underserved needs

The next layer will use grounded evidence to generate candidate opportunities and calculate the ProductForge opportunity score. No score is treated as a guarantee of profitability.

## Local setup
1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the ProductForge Supabase URL and publishable key.
4. Add an Exa API key as `EXA_API_KEY`.
5. Run `npm run dev`.

Never commit service-role keys, Exa keys, or other private credentials.
