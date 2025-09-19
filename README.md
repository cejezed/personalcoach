# Coach App - Time Tracking & Health Dashboard

A comprehensive Node.js monorepo coach application with time tracking, health monitoring, and billing features using Supabase.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com/dashboard/projects)
2. Copy the database URL from Connection -> Transaction pooler
3. Set the `DATABASE_URL` environment variable with your Supabase connection string
4. Run the Supabase migrations to set up the database schema
5. Set the following environment variables in your Replit:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key

## Development

```bash
# Install dependencies
pnpm install

# Run development servers
./dev.sh
