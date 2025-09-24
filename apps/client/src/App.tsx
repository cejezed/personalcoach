// apps/client/src/App.tsx
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

import { supabase } from "@/lib/supabase";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Time from "@/pages/Time";
import Budgets from "@/pages/Budgets";
import Invoices from "@/pages/Invoices";
import Health from "@/pages/Health";
import Coach from "@/pages/Coach";
import Backup from "@/pages/Backup";

// Toggle: gebruik mock user tijdens development (snel testen zonder echte login)
const USE_MOCK_AUTH = true;

function AppRoutes({ user }: { user: User }) {
  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/time" element={<Time />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/ideas" element={require('./pages/Ideas').default ? require('./pages/Ideas').default() : null} />
        <Route path="/calendar" element={require('./pages/Calendar').default ? require('./pages/Calendar').default() : null} />
        <Route path="/settings" element={require('./pages/Settings').default ? require('./pages/Settings').default() : null} />
        <Route path="/invoices" element={<Invoices />} />
        {/* RRD v6 wildcard voor eventuele subroutes onder /health */}
        <Route path="/health/*" element={<Health />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/backup" element={<Backup />} />
        {/* Toegevoegd: route voor Projecten */}
        <Route path="/projects" element={require('./pages/Projecten').default ? require('./pages/Projecten').default() : null} />
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  404 - Page Not Found
                </h1>
                <p className="text-muted-foreground">
                  The page you're looking for doesn't exist.
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Supabase auth bootstrap + listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Kies mock of echte auth
  const effectiveUser: User | null = USE_MOCK_AUTH
    ? ({ id: "mock-user", email: "dev@example.com" } as User)
    : user;

  if (!effectiveUser) {
    // echte login tonen wanneer USE_MOCK_AUTH=false en geen session is
    return <Login />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppRoutes user={effectiveUser} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
