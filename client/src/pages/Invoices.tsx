export default function Invoices() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
        <p className="text-muted-foreground mt-2">Generate and manage invoices</p>
      </div>
      
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <h2 className="text-xl font-medium text-foreground mb-2">Invoice Management</h2>
        <p className="text-muted-foreground">Create invoices from logged time entries and track payment status.</p>
      </div>
    </div>
  );
}
