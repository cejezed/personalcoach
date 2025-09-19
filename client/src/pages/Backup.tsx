export default function Backup() {
  const handleExportJSON = () => {
    // Mock JSON export
    console.log('Exporting data as JSON...');
  };

  const handleExportCSV = () => {
    // Mock CSV export
    console.log('Exporting data as CSV...');
  };

  const handleImportJSON = () => {
    // Mock JSON import
    console.log('Importing JSON data...');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Backup & Export</h1>
        <p className="text-muted-foreground mt-2">Export and import your data for backup purposes</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Export Data</h2>
          <div className="space-y-4">
            <button 
              onClick={handleExportJSON}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              data-testid="button-export-json"
            >
              Export All Data (JSON)
            </button>
            <button 
              onClick={handleExportCSV}
              className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
              data-testid="button-export-csv"
            >
              Export Tables (CSV)
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Import Data</h2>
          <div className="space-y-4">
            <button 
              onClick={handleImportJSON}
              className="w-full border border-border text-foreground px-4 py-2 rounded-md hover:bg-accent transition-colors"
              data-testid="button-import-json"
            >
              Import JSON Data
            </button>
            <p className="text-sm text-muted-foreground">
              Import data with automatic upsert for existing records. Steps data will use the bulk import RPC function.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
