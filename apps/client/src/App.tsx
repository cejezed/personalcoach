import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Projecten from "@/pages/Projecten";
import "./styles.css";

const qc = new QueryClient();

export default function App() {
  const [email, setEmail] = React.useState("");
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub?.subscription.unsubscribe();
  }, []);

  async function signIn() {
    // eenvoudige magic-link login (zet in Supabase Auth → Email templates)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) alert(error.message);
    else alert("Check je e-mail voor de login link.");
  }

  async function signOut() { await supabase.auth.signOut(); }

  return (
    <QueryClientProvider client={qc}>
      <div className="container">
        <h1>Personal Coach</h1>
        {!user ? (
          <div className="card">
            <h2>Inloggen</h2>
            <label>Email</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="jij@voorbeeld.nl" />
            <div style={{ marginTop: 8 }}>
              <button onClick={signIn}>Stuur magic link</button>
            </div>
            <div className="badge">Je krijgt een e-mail met inloglink (Supabase Auth).</div>
          </div>
        ) : (
          <>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="badge">Ingelogd als {user.email}</div>
              <button className="ghost" onClick={signOut}>Uitloggen</button>
            </div>
            <hr/>
            <Projecten />
          </>
        )}
      </div>
    </QueryClientProvider>
  );
}
