# Coach App – Time Tracking & Health Dashboard

Een Node.js monorepo coach applicatie met:
- ⏱️ Tijdregistratie (projecten, fases, taken, entries)
- ❤️ Health tracking (energie, slaap, beweging, voeding)
- 💳 Billing (uurtarief, fixed, capped modellen, facturatie)
- 🔐 Supabase voor auth, database, storage
- 🌐 Frontend: React/Next.js + Vite
- ⚡ API: Express server

---

## 🚀 Setup

1. Maak een project aan in [Supabase](https://supabase.com/dashboard/projects).
2. Kopieer je **Database URL** uit *Connection → Transaction Pooler*.
3. Zet de volgende environment variables (in `.env` of via Replit/GitHub Codespaces → Secrets):

   ```env
   DATABASE_URL=postgres://...
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
