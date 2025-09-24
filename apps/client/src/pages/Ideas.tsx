// apps/client/src/pages/Ideas.tsx
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lightbulb,
  Filter,
  Search,
  Plus,
  Image as ImageIcon,
  Calendar,
  Star,
  Edit,
  Trash2,
  X,
  Upload,
  ArrowUpDown,
  Grid,
  List
} from "lucide-react";
import { api } from "@/lib/api";

/* =======================
   Types
======================= */
type Idea = {
  id: string;
  title: string;
  description: string;
  category: "business" | "project" | "personal" | "creative" | "other";
  image_url?: string;
  tags?: string[];
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at?: string;
};

type SortOption = "newest" | "oldest" | "priority" | "category" | "title";
type ViewMode = "grid" | "list";

/* =======================
   Helpers
======================= */
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const categoryColor: Record<Idea["category"], string> = {
  business: "bg-blue-100 text-blue-800 border-blue-200",
  project: "bg-green-100 text-green-800 border-green-200",
  creative: "bg-purple-100 text-purple-800 border-purple-200",
  personal: "bg-pink-100 text-pink-800 border-pink-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};

const priorityBadge: Record<Idea["priority"], string> = {
  high: "text-red-600 bg-red-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-green-600 bg-green-50",
};

const categoryText: Record<Idea["category"], string> = {
  business: "Business",
  project: "Project",
  creative: "Creatief",
  personal: "Persoonlijk",
  other: "Overig",
};

const priorityText: Record<Idea["priority"], string> = {
  high: "Prioriteit!",
  medium: "Interessant",
  low: "Ooit eens",
};

/* =======================
   API
======================= */
async function fetchIdeas(): Promise<Idea[]> {
  const res = await api.get("/api/ideas");
  const data = res?.data ?? res; // jouw api helper kan .data teruggeven
  return Array.isArray(data) ? data : [];
}

async function createIdea(payload: {
  title: string;
  description: string;
  category: Idea["category"];
  priority: Idea["priority"];
  image?: File | null;
}) {
  // Als je upload ondersteunt
  if (payload.image) {
    const fd = new FormData();
    fd.append("title", payload.title);
    fd.append("description", payload.description);
    fd.append("category", payload.category);
    fd.append("priority", payload.priority);
    fd.append("image", payload.image);
    return api.post("/api/ideas", fd);
  }
  return api.post("/api/ideas", payload);
}

async function updateIdea(id: string, payload: Partial<Idea> & { image?: File | null }) {
  if (payload.image) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v == null) return;
      if (k === "image") fd.append("image", v as File);
      else fd.append(k, String(v));
    });
    return api.patch(`/api/ideas/${id}`, fd);
  }
  return api.patch(`/api/ideas/${id}`, payload);
}

async function deleteIdea(id: string) {
  return api.delete(`/api/ideas/${id}`);
}

/* =======================
   Component
======================= */
export default function Ideas() {
  const qc = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const [ideaForm, setIdeaForm] = useState({
    title: "",
    description: "",
    category: "other" as Idea["category"],
    priority: "medium" as Idea["priority"],
    image: null as File | null,
  });

  const { data: ideas = [], isLoading, isError, error } = useQuery({
    queryKey: ["ideas"],
    queryFn: fetchIdeas,
  });

  const createMut = useMutation({
    mutationFn: createIdea,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ideas"] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Idea> & { image?: File | null } }) =>
      updateIdea(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ideas"] });
      setShowEditModal(false);
      setEditingIdea(null);
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteIdea(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });

  function resetForm() {
    setIdeaForm({
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      image: null,
    });
  }

  function openEdit(idea: Idea) {
    setEditingIdea(idea);
    setIdeaForm({
      title: idea.title,
      description: idea.description,
      category: idea.category,
      priority: idea.priority,
      image: null,
    });
    setShowEditModal(true);
  }

  const filteredSorted = useMemo(() => {
    let list = Array.isArray(ideas) ? [...ideas] : [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== "all") list = list.filter((i) => i.category === filterCategory);
    if (filterPriority !== "all") list = list.filter((i) => i.priority === filterPriority);

    list.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return +new Date(a.created_at) - +new Date(b.created_at);
        case "priority":
          // high > medium > low
          const rank = { high: 3, medium: 2, low: 1 } as const;
          return rank[b.priority] - rank[a.priority];
        case "category":
          return a.category.localeCompare(b.category);
        case "title":
          return a.title.localeCompare(b.title);
        case "newest":
        default:
          return +new Date(b.created_at) - +new Date(a.created_at);
      }
    });

    return list;
  }, [ideas, searchQuery, filterCategory, filterPriority, sortBy]);

  /* ====== RENDER ====== */
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Ideeën</h1>
            <p className="text-sm text-muted-foreground">
              Verzamel, filter en rangschik je ideeën.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-2 py-2 rounded-lg ${viewMode === "grid" ? "bg-secondary" : "hover:bg-muted"}`}
            title="Grid"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-2 py-2 rounded-lg ${viewMode === "list" ? "bg-secondary" : "hover:bg-muted"}`}
            title="Lijst"
          >
            <List className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Nieuw idee
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoeken…"
            className="bg-transparent outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background"
          >
            <option value="all">Alle categorieën</option>
            <option value="business">Business</option>
            <option value="project">Project</option>
            <option value="creative">Creatief</option>
            <option value="personal">Persoonlijk</option>
            <option value="other">Overig</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background"
          >
            <option value="all">Alle prioriteiten</option>
            <option value="high">Hoog</option>
            <option value="medium">Middel</option>
            <option value="low">Laag</option>
          </select>

          <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2 py-1 bg-background"
            >
              <option value="newest">Nieuwste</option>
              <option value="oldest">Oudste</option>
              <option value="priority">Prioriteit</option>
              <option value="category">Categorie</option>
              <option value="title">Titel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading && <p className="text-muted-foreground">Laden…</p>}
      {isError && (
        <p className="text-red-600">
          Kon ideeën niet laden: {(error as Error)?.message ?? "onbekende fout"}
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {filteredSorted.length === 0 ? (
            <div className="p-8 border rounded-xl text-center text-muted-foreground">
              Geen ideeën gevonden. Probeer een andere zoekterm of maak een nieuw idee aan.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSorted.map((i) => (
                <article key={i.id} className="border rounded-xl p-4 bg-card">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{i.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${priorityBadge[i.priority]}`}>
                      {priorityText[i.priority]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {i.description}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs border px-2 py-1 rounded ${categoryColor[i.category]}`}>
                      {categoryText[i.category]}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(i.created_at)}
                    </span>
                    {i.image_url && (
                      <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> afbeelding
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => openEdit(i)}
                      className="px-2 py-1 rounded border hover:bg-muted flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" /> Bewerken
                    </button>
                    <button
                      onClick={() => deleteMut.mutate(i.id)}
                      className="px-2 py-1 rounded border hover:bg-muted text-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Verwijderen
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left px-4 py-2">Titel</th>
                    <th className="text-left px-4 py-2">Categorie</th>
                    <th className="text-left px-4 py-2">Prioriteit</th>
                    <th className="text-left px-4 py-2">Aangemaakt</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="px-4 py-2">{i.title}</td>
                      <td className="px-4 py-2">{categoryText[i.category]}</td>
                      <td className="px-4 py-2">{priorityText[i.priority]}</td>
                      <td className="px-4 py-2">{formatDate(i.created_at)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => openEdit(i)}
                          className="px-2 py-1 rounded border hover:bg-muted mr-2"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => deleteMut.mutate(i.id)}
                          className="px-2 py-1 rounded border hover:bg-muted text-red-600"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {showCreateModal ? "Nieuw idee" : `Bewerk: ${editingIdea?.title}`}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingIdea(null);
                  resetForm();
                }}
                className="p-2 rounded hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (showCreateModal) {
                  createMut.mutate(ideaForm);
                } else if (showEditModal && editingIdea) {
                  updateMut.mutate({
                    id: editingIdea.id,
                    payload: {
                      title: ideaForm.title,
                      description: ideaForm.description,
                      category: ideaForm.category,
                      priority: ideaForm.priority,
                      image: ideaForm.image,
                    },
                  });
                }
              }}
            >
              <div>
                <label className="text-sm font-medium">Titel</label>
                <input
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  value={ideaForm.title}
                  onChange={(e) => setIdeaForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Omschrijving</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                  rows={4}
                  value={ideaForm.description}
                  onChange={(e) => setIdeaForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Categorie</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    value={ideaForm.category}
                    onChange={(e) =>
                      setIdeaForm((f) => ({ ...f, category: e.target.value as Idea["category"] }))
                    }
                  >
                    <option value="business">Business</option>
                    <option value="project">Project</option>
                    <option value="creative">Creatief</option>
                    <option value="personal">Persoonlijk</option>
                    <option value="other">Overig</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Prioriteit</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                    value={ideaForm.priority}
                    onChange={(e) =>
                      setIdeaForm((f) => ({ ...f, priority: e.target.value as Idea["priority"] }))
                    }
                  >
                    <option value="high">Hoog</option>
                    <option value="medium">Middel</option>
                    <option value="low">Laag</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Afbeelding (optioneel)</label>
                  <label className="mt-1 flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-muted">
                    <Upload className="w-4 h-4" />
                    <span className="truncate">
                      {ideaForm.image ? ideaForm.image.name : "Kies bestand…"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setIdeaForm((s) => ({ ...s, image: f }));
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingIdea(null);
                    resetForm();
                  }}
                  className="px-3 py-2 rounded-lg border hover:bg-muted"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {showCreateModal ? "Opslaan" : "Wijzigen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
