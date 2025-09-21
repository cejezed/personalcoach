import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Clock, 
  Calendar, 
  Euro, 
  CheckSquare, 
  Plus,
  FileText, 
  Play,
  Pause,
  OctagonMinus,
  Lightbulb,
  TrendingUp,
  Activity,
  Star
} from "lucide-react";

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerDuration, setTimerDuration] = useState("02:34:12");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock coach suggestions query
  const { data: suggestions } = useQuery({
    queryKey: ['/api/coach/suggestions'],
    queryFn: async () => {
      // Mock data for demonstration
      return {
        suggestions: [
          {
            id: '1',
            type: 'break',
            title: 'Take a Break',
            message: 'You\'ve been working for 2.5 hours straight. Consider taking a 15-minute break to maintain productivity.',
            icon: 'lightbulb'
          },
          {
            id: '2',
            type: 'billing',
            title: 'Billing Opportunity',
            message: 'You have €2,450 in unbilled time. Consider generating invoices for completed project phases.',
            icon: 'chart-line'
          },
          {
            id: '3',
            type: 'health',
            title: 'Health Reminder',
            message: 'You\'re 2,000 steps short of your daily goal. Try taking a short walk or using the stairs.',
            icon: 'heart'
          }
        ]
      };
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });

  const handleTimerAction = (action: 'start' | 'pause' | 'stop') => {
    if (action === 'stop') {
      setIsTimerRunning(false);
      setTimerDuration("00:00:00");
    } else if (action === 'pause') {
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          className="flex-1 bg-primary text-primary-foreground rounded-lg px-6 py-4 text-left hover:bg-primary/90 transition-colors"
          data-testid="button-start-timer"
        >
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5" />
            <div>
              <h3 className="font-medium">Start Timer</h3>
              <p className="text-sm opacity-90">Begin tracking time</p>
            </div>
          </div>
        </button>
        <button 
          className="flex-1 bg-card border border-border text-card-foreground rounded-lg px-6 py-4 text-left hover:bg-accent transition-colors"
          data-testid="button-generate-invoice"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">Generate Invoice</h3>
              <p className="text-sm text-muted-foreground">Create from open work</p>
            </div>
          </div>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Hours Today</dt>
                <dd className="text-2xl font-semibold text-foreground" data-testid="stat-hours-today">7.5</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-chart-2" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">This Week</dt>
                <dd className="text-2xl font-semibold text-foreground" data-testid="stat-hours-week">32.5</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Euro className="h-6 w-6 text-chart-4" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Open Billing</dt>
                <dd className="text-2xl font-semibold text-foreground" data-testid="stat-open-billing">€2,450</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckSquare className="h-6 w-6 text-chart-1" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Active Tasks</dt>
                <dd className="text-2xl font-semibold text-foreground" data-testid="stat-active-tasks">12</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Current Time Entry & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Current Time Entry */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Current Time Entry</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground" data-testid="text-current-task">Website Redesign</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-current-project">ABC Company - Design Phase</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-primary" data-testid="text-timer-duration">{timerDuration}</div>
                  <div className="text-sm text-muted-foreground">Started at <span data-testid="text-start-time">14:25</span></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleTimerAction('stop')}
                  className="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
                  data-testid="button-stop-timer"
                >
                  <OctagonMinus className="h-4 w-4" />OctagonMinus
                </button>
                <button 
                  onClick={() => handleTimerAction(isTimerRunning ? 'pause' : 'start')}
                  className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                  data-testid="button-pause-timer"
                >
                  {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isTimerRunning ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground" data-testid="text-recent-task-1">API Development</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-recent-project-1">XYZ Corp - Backend</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-foreground" data-testid="text-recent-duration-1">1h 45m</div>
                  <div className="text-xs text-muted-foreground" data-testid="text-recent-date-1">Today</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Database Optimization</h4>
                  <p className="text-sm text-muted-foreground">Internal - DevOps</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-foreground">2h 15m</div>
                  <div className="text-xs text-muted-foreground">Yesterday</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Client Meeting</h4>
                  <p className="text-sm text-muted-foreground">ABC Company - Planning</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-foreground">45m</div>
                  <div className="text-xs text-muted-foreground">Yesterday</div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 text-primary hover:text-primary/80 text-sm font-medium" data-testid="button-view-all-entries">
              View all entries
            </button>
          </div>
        </div>
      </div>

      {/* Project Status & Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Project Status */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Project Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-foreground" data-testid="text-project-name-1">ABC Company Website</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-2/10 text-chart-2">
                    In Progress
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Budgeted:</span>
                    <div className="font-mono font-medium" data-testid="text-budget-hours-1">80h</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Logged:</span>
                    <div className="font-mono font-medium" data-testid="text-logged-hours-1">45h</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Open Billing:</span>
                    <div className="font-mono font-medium" data-testid="text-open-billing-1">€1,250</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span data-testid="text-progress-1">56%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '56%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-foreground">XYZ Corp API</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-1/10 text-chart-1">
                    Near Deadline
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Budgeted:</span>
                    <div className="font-mono font-medium">60h</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Logged:</span>
                    <div className="font-mono font-medium">52h</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Open Billing:</span>
                    <div className="font-mono font-medium">€1,200</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>87%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-chart-1 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Overview */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Health Overview</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Today's Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm">Steps</span>
                    </div>
                    <span className="font-mono font-medium" data-testid="text-steps-today">8,432</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-chart-2" />
                      <span className="text-sm">Workouts</span>
                    </div>
                    <span className="font-mono font-medium" data-testid="text-workouts-today">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-chart-4" />
                      <span className="text-sm">Sleep</span>
                    </div>
                    <span className="font-mono font-medium" data-testid="text-sleep-last">7h 30m</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Energy Level</h3>
                <div className="flex items-center gap-2">
                  <div className="flex" data-testid="energy-level-stars">
                    <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                    <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                    <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                    <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Good</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Weekly Goals</h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Workouts (5/week)</span>
                      <span data-testid="text-workout-progress">4/5</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-chart-2 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Steps (70k/week)</span>
                      <span data-testid="text-steps-progress">52k/70k</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '74%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Suggestions */}
      <div className="bg-gradient-to-r from-primary/5 to-chart-2/5 rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">Coach Suggestions</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {suggestions?.suggestions.map((suggestion, index) => (
              <div key={suggestion.id} className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
                <Lightbulb className="h-5 w-5 text-chart-4 mt-1" />
                <div>
                  <h3 className="font-medium text-foreground" data-testid={`text-suggestion-title-${index}`}>{suggestion.title}</h3>
                  <p className="text-sm text-muted-foreground" data-testid={`text-suggestion-message-${index}`}>{suggestion.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
