import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Heart, 
  Droplets, 
  Moon, 
  Zap, 
  Target, 
  Plus,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';

type HealthMetric = {
  id: string;
  type: 'weight' | 'sleep' | 'water' | 'exercise' | 'mood' | 'energy';
  value: number;
  date: string;
  notes?: string;
};

type Goal = {
  id: string;
  type: 'weight' | 'sleep' | 'water' | 'exercise' | 'mood' | 'energy';
  target: number;
  current: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly';
};

const HealthPage: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      type: 'water',
      target: 8,
      current: 3,
      unit: 'glazen',
      period: 'daily'
    },
    {
      id: '2',
      type: 'sleep',
      target: 8,
      current: 7.5,
      unit: 'uren',
      period: 'daily'
    },
    {
      id: '3',
      type: 'exercise',
      target: 3,
      current: 2,
      unit: 'sessies',
      period: 'weekly'
    }
  ]);
  
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetric, setNewMetric] = useState({
    type: 'weight' as HealthMetric['type'],
    value: '',
    notes: ''
  });

  const metricTypes = [
    { type: 'weight', label: 'Gewicht', icon: Target, unit: 'kg', color: 'blue' },
    { type: 'sleep', label: 'Slaap', icon: Moon, unit: 'uren', color: 'purple' },
    { type: 'water', label: 'Water', icon: Droplets, unit: 'glazen', color: 'cyan' },
    { type: 'exercise', label: 'Sport', icon: Activity, unit: 'minuten', color: 'green' },
    { type: 'mood', label: 'Humeur', icon: Heart, unit: '/10', color: 'pink' },
    { type: 'energy', label: 'Energie', icon: Zap, unit: '/10', color: 'yellow' }
  ];

  // Load sample data on component mount
  useEffect(() => {
    const sampleData: HealthMetric[] = [
      { id: '1', type: 'weight', value: 75.2, date: new Date(Date.now() - 86400000).toISOString() },
      { id: '2', type: 'sleep', value: 7.5, date: new Date(Date.now() - 86400000).toISOString() },
      { id: '3', type: 'water', value: 6, date: new Date(Date.now() - 86400000).toISOString() },
      { id: '4', type: 'exercise', value: 45, date: new Date(Date.now() - 86400000).toISOString() },
      { id: '5', type: 'mood', value: 8, date: new Date().toISOString() },
      { id: '6', type: 'energy', value: 7, date: new Date().toISOString() }
    ];
    setMetrics(sampleData);
  }, []);

  const addMetric = () => {
    if (!newMetric.value) return;
    
    const metric: HealthMetric = {
      id: Date.now().toString(),
      type: newMetric.type,
      value: parseFloat(newMetric.value),
      date: new Date().toISOString(),
      notes: newMetric.notes || undefined
    };
    
    setMetrics(prev => [metric, ...prev]);
    setNewMetric({ type: 'weight', value: '', notes: '' });
    setShowAddMetric(false);
  };

  const getLatestMetric = (type: HealthMetric['type']): HealthMetric | undefined => {
    return metrics
      .filter(m => m.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const getMetricTypeConfig = (type: HealthMetric['type']) => {
    return metricTypes.find(mt => mt.type === type);
  };

  const calculateProgress = (goal: Goal): number => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    
    if (date.toDateString() === today.toDateString()) return 'Vandaag';
    if (date.toDateString() === yesterday.toDateString()) return 'Gisteren';
    return date.toLocaleDateString('nl-NL');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gezondheid</h1>
          <p className="text-muted-foreground mt-2">Monitor je welzijn en doelen</p>
        </div>
        <button
          onClick={() => setShowAddMetric(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Meting toevoegen
        </button>
      </div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const config = getMetricTypeConfig(goal.type);
          const progress = calculateProgress(goal);
          const Icon = config?.icon || Target;
          
          return (
            <div key={goal.id} className="bg-card rounded-xl p-6 border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Icon className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{config?.label}</h3>
                    <p className="text-sm text-muted-foreground">{goal.period === 'daily' ? 'Dagelijks' : goal.period === 'weekly' ? 'Wekelijks' : 'Maandelijks'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Voortgang</span>
                  <span className="font-medium">{goal.current} / {goal.target} {goal.unit}</span>
                </div>
                
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">{Math.round(progress)}% van doel</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Metrics */}
      <div className="bg-card rounded-xl p-6 border">
        <h2 className="text-xl font-semibold text-card-foreground mb-6">Recente metingen</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricTypes.map((config) => {
            const latest = getLatestMetric(config.type);
            const Icon = config.icon;
            
            return (
              <div key={config.type} className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-card-foreground">{config.label}</span>
                </div>
                
                {latest ? (
                  <div>
                    <div className="text-2xl font-bold text-card-foreground">
                      {latest.value} <span className="text-sm font-normal text-muted-foreground">{config.unit}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(latest.date)}
                    </div>
                    {latest.notes && (
                      <div className="text-sm text-muted-foreground mt-2 italic">
                        "{latest.notes}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Nog geen metingen
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div className="bg-card rounded-xl p-6 border">
        <h2 className="text-xl font-semibold text-card-foreground mb-6">Geschiedenis</h2>
        
        {metrics.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nog geen metingen toegevoegd</p>
          </div>
        ) : (
          <div className="space-y-3">
            {metrics
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((metric) => {
                const config = getMetricTypeConfig(metric.type);
                const Icon = config?.icon || Target;
                
                return (
                  <div key={metric.id} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                    <div className="p-2 bg-secondary rounded-lg">
                      <Icon className="w-4 h-4 text-secondary-foreground" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-card-foreground">{config?.label}</span>
                        <span className="font-bold text-card-foreground">
                          {metric.value} {config?.unit}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(metric.date)}
                        {metric.notes && ` • ${metric.notes}`}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Add Metric Modal */}
      {showAddMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Nieuwe meting toevoegen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">Type</label>
                <select
                  value={newMetric.type}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, type: e.target.value as HealthMetric['type'] }))}
                  className="w-full p-3 border rounded-lg bg-background text-foreground"
                >
                  {metricTypes.map((type) => (
                    <option key={type.type} value={type.type}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Waarde ({getMetricTypeConfig(newMetric.type)?.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newMetric.value}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full p-3 border rounded-lg bg-background text-foreground"
                  placeholder="Voer waarde in"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">Notities (optioneel)</label>
                <textarea
                  value={newMetric.notes}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border rounded-lg bg-background text-foreground h-20 resize-none"
                  placeholder="Extra opmerkingen..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddMetric(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={addMetric}
                disabled={!newMetric.value}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthPage;