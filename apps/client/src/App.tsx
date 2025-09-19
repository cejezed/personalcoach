import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Projecten from "@/pages/Projecten";

const qc = new QueryClient();

export default function App() {
  const [email, setEmail] = React.useState("");
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => sub?.subscription.unsubscribe();
  }, []);

  async function signIn() {
    // eenvoudige magic-link login (zet in Supabase Auth → Email templates)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) alert(error.message);
    else alert("Check je e-mail voor de login link.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <QueryClientProvider client={qc}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Personal Coach</h1>

        {!user ? (
          <div className="card bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold mb-2">Inloggen</h2>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.nl"
              className="border px-2 py-1 rounded w-full"
            />
            <div className="mt-3">
              <button
                onClick={signIn}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Stuur magic link
              </button>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Je krijgt een e-mail met inloglink (Supabase Auth).
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-700">
                Ingelogd als {user.email}
              </div>
              <button
                className="border px-3 py-1 rounded hover:bg-gray-100"
                onClick={signOut}
              >
                Uitloggen
              </button>
            </div>
            <hr className="mb-4" />
            <Projecten />
          </>
        )}
      </div>
    </QueryClientProvider>
  );
}
