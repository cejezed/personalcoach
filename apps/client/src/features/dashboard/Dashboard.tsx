// apps/client/src/features/dashboard/Dashboard.tsx
import React from "react";
import TaskList from "./components/TaskList";
import TimeSummary from "./components/TimeSummary";
import ProjectTable from "./components/ProjectTable";
import NewsDashboard from "./components/NewsDashboard";
import { Clock, CheckSquare, FolderKanban } from "lucide-react";

// ... KPICard component blijft hetzelfde ...

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* KPI rij */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-3">
        <KPICard label="Uren (week)" value="—" sublabel="t/m vandaag" icon={<Clock className="h-5 w-5" />} />
        <KPICard label="Open taken" value="—" sublabel="" icon={<CheckSquare className="h-5 w-5" />} />
        <KPICard label="Actieve projecten" value="—" sublabel="" icon={<FolderKanban className="h-5 w-5" />} />
      </div>

      {/* Linkerkolom */}
      <div className="lg:col-span-2 grid gap-4">
        <TimeSummary />
        <ProjectTable />
      </div>

      {/* Rechterkolom */}
      <div className="lg:col-span-1 grid gap-4">
        <TaskList />
      </div>

      {/* Nieuws sectie - volledige breedte */}
      <div className="lg:col-span-3">
        <NewsDashboard />
      </div>
    </div>
  );
}