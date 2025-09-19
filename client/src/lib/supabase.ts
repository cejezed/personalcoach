// client/src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Verwacht de volgende env-vars in client/.env.local:
 * VITE_SUPABASE_URL=https://<project>.supabase.co
 * VITE_SUPABASE_ANON_KEY=<anon-public-key>
 *
 * Na toevoegen: dev server herstarten (Vite leest env alleen bij start).
 */

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Gooi een duidelijke error i.p.v. createClient met lege strings
    throw new Error(
      "❌ Supabase niet geconfigureerd. Zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in client/.env.local en herstart de dev server."
    );
  }

  _supabase = createClient(url, anonKey);
  return _supabase;
}

// Optioneel: voor bestaande code die `supabase` direct importeert
export const supabase = (() => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // laat deze export bestaan, maar voorkom cryptische runtime-crash
    console.warn(
      "[supabase] VITE vars missen; gebruik getSupabase() na correcte .env setup."
    );
    // @ts-expect-error: wordt pas correct wanneer env aanwezig is
    return null as unknown as SupabaseClient;
  }
  return createClient(url, anonKey);
})();
