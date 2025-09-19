export default function Time() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Time Tracking</h1>
        <p className="text-muted-foreground mt-2">Track time entries and manage billing</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Time Entry</h2>
          <p className="text-muted-foreground">Start and manage time entries for your projects.</p>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Billing Overview</h2>
          <p className="text-muted-foreground">View billing status and generate invoices.</p>
        </div>
      </div>
    </div>
  );
}
