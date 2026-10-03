# PulseDesk — Employee Data Collection Platform

A category-based employee data collection UI built with React + Vite + Supabase.

## Collection phases

1. Profile
2. Work Pattern
3. Lifestyle
4. Diet & Habits
5. Health History
6. Body Metrics
7. Blood Pressure
8. Review & Submit

Derived fields are calculated automatically instead of being entered manually: age group, BMI, BMI category, average BP, BP category, stress category and a simple risk score/level.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Use the Supabase publishable key in the browser. Never put a service-role key in frontend code.

## Supabase setup

Open Supabase SQL Editor and run `supabase/schema.sql`.

For production, add Supabase Auth for collectors and make the RLS policies match your organization. This project intentionally does not expose the table to the `anon` role because the dataset contains sensitive health-related information.

## Important

The risk calculation included here is a prototype application rule based on the fields in the supplied CSV. It is not a clinical risk model and should not be presented as medical diagnosis or medical advice.
