import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Temporary simple pages to get the app working
function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Coach App Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Hours Today</h3>
            <p className="text-3xl font-bold text-blue-600">7.5</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">This Week</h3>
            <p className="text-3xl font-bold text-green-600">32.5</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Open Billing</h3>
            <p className="text-3xl font-bold text-yellow-600">€2,450</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Active Tasks</h3>
            <p className="text-3xl font-bold text-purple-600">12</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeTracking() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Time Tracking</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Time tracking features coming soon...</p>
        </div>
      </div>
    </div>
  );
}

function Tasks() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tasks</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Task management features coming soon...</p>
        </div>
      </div>
    </div>
  );
}

function Health() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Health Tracking</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Steps Today</h3>
            <p className="text-2xl font-bold text-green-600">8,432</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Workouts</h3>
            <p className="text-2xl font-bold text-blue-600">2</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/time" component={TimeTracking} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/health" component={Health} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
