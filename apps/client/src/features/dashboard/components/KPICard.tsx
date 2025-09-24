import React from "react";
import Card from "../ui/Card";

export default function KPICard({
  label, value, sublabel, icon,
}: {
  label: string; value: string | number; sublabel?: string; icon?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        {icon && <div className="h-10 w-10 grid place-items-center rounded-xl bg-slate-100">{icon}</div>}
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
          {sublabel && <div className="text-xs text-slate-500 mt-1">{sublabel}</div>}
        </div>
      </div>
    </Card>
  );
}
