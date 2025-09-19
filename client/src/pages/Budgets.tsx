export default function Budgets() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Budget Management</h1>
        <p className="text-muted-foreground mt-2">Configure project rates and billing models</p>
      </div>
      
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <h2 className="text-xl font-medium text-foreground mb-2">Budget Configuration</h2>
        <p className="text-muted-foreground">Set up hourly rates, fixed pricing, and capped billing models for your projects.</p>
      </div>
    </div>
  );
}
