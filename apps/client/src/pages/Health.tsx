import { Switch, Route, Link, useLocation } from "wouter";
import { Activity, Footprints } from "lucide-react";

function WorkoutsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Today's Workouts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Morning Run</h3>
            <p className="text-sm text-muted-foreground">30 minutes • High intensity</p>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Push-ups</h3>
            <p className="text-sm text-muted-foreground">50 reps • Medium intensity</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Activity Checklist</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Walking', 'Running', 'Push-ups', 'Yoga', 'Cycling', 'Swimming', 'Weight Training', 'Stretching'].map((activity) => (
            <button
              key={activity}
              className="p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors"
              data-testid={`button-activity-${activity.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="font-medium text-foreground">{activity}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Steps Overview (Last 30 Days)</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Today</span>
            <span className="font-mono font-medium" data-testid="text-steps-today">8,432</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Yesterday</span>
            <span className="font-mono font-medium">9,651</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">2 days ago</span>
            <span className="font-mono font-medium">7,234</span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Import Steps Data</h2>
        <p className="text-muted-foreground mb-4">Upload JSON data to bulk import steps information.</p>
        <button 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          data-testid="button-import-steps"
        >
          Import JSON
        </button>
      </div>
    </div>
  );
}

export default function Health() {
  const [location] = useLocation();
  const currentTab = location === '/health/steps' ? 'steps' : 'workouts';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Health Tracking</h1>
        <p className="text-muted-foreground mt-2">Monitor your workouts, steps, and wellness metrics</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <Link
            href="/health"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'workouts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            data-testid="tab-workouts"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Workouts
            </div>
          </Link>
          <Link
            href="/health/steps"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'steps'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
            data-testid="tab-steps"
          >
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              Steps
            </div>
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      <Switch>
        <Route path="/health/steps" component={StepsTab} />
        <Route path="/health/*?" component={WorkoutsTab} />
      </Switch>
    </div>
  );
}
