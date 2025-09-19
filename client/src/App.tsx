import { Switch, Route } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Time from "./pages/Time";
import Budgets from "./pages/Budgets";
import Invoices from "./pages/Invoices";
import Health from "./pages/Health";
import Coach from "./pages/Coach";
import Backup from "./pages/Backup";

function Router({ user }: { user: User }) {
  return (
    <Layout user={user}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/time" component={Time} />
        <Route path="/budgets" component={Budgets} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/health/*?" component={Health} />
        <Route path="/coach" component={Coach} />
        <Route path="/backup" component={Backup} />
        <Route path="*">
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">404 - Page Not Found</h1>
              <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
            </div>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Temporarily skip authentication for development
  // if (!user) {
  //   return <Login />;
  // }
  const mockUser = { id: '1', email: 'dev@example.com' } as User;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router user={mockUser} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
