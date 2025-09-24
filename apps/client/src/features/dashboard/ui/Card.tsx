import React from "react";

export default function Card({
  title,
  children,
  right,
  className = "",
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between px-4 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
