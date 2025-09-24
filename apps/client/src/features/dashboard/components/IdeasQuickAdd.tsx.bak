import React, { useState } from "react";
import Card from "../ui/Card";
import { apiRequest } from "@/lib/queryClient";

export default function IdeasQuickAdd() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveIdea() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await apiRequest("/ideas", { method: "POST", body: JSON.stringify({ text }) });
      setText("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Snel idee opslaan">
      <textarea
        className="w-full rounded-xl border border-slate-200 p-3 text-sm"
        rows={3}
        value={text}
        onChange={(e)=>setText(e.target.value)}
        placeholder="Schiet er iets te binnen? Noteer het hier…"
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={saveIdea}
          disabled={saving || !text.trim()}
          className="px-3 py-2 text-sm rounded-lg bg-slate-900 text-white disabled:opacity-40"
        >
          {saving ? "Opslaan…" : "Opslaan"}
        </button>
      </div>
    </Card>
  );
}
