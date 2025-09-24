import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Lightbulb, 
  Filter,
  Search,
  Plus,
  Image,
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
   Helper Functions
======================= */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getCategoryColor = (category: string) => {
  const colors = {
    business: "bg-blue-100 text-blue-800 border-blue-200",
    project: "bg-green-100 text-green-800 border-green-200", 
    creative: "bg-purple-100 text-purple-800 border-purple-200",
    personal: "bg-pink-100 text-pink-800 border-pink-200",
    other: "bg-gray-100 text-gray-800 border-gray-200"
  };
  return colors[category as keyof typeof colors] || colors.other;
};

const getPriorityColor = (priority: string) => {
  const colors = {
    high: "text-red-600 bg-red-50",
    medium: "text-yellow-600 bg-yellow-50", 
    low: "text-green-600 bg-green-50"
  };
  return colors[priority as keyof typeof colors] || colors.low;
};

const getPriorityText = (priority: string) => {
  const text = {
    high: "Prioriteit!",
    medium: "Interessant",
    low: "Ooit eens"
  };
  return text[priority as keyof typeof text] || "Onbekend";
};

const getCategoryText = (category: string) => {
  const text = {
    business: "Business",
    project: "Project", 
    creative: "Creatief",
    personal: "Persoonlijk",
    other: "Overig"
  };
  return text[category as keyof typeof text] || "Onbekend";
};

/* =======================
   Main Component
======================= */
export default function Ideas() {
  const queryClient = useQueryClient();

  /* ---- State ---- */
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  
  /* ---- Form States ---- */
  const [ideaForm, setIdeaForm] = useState({
    title: "",
    description: "",
    category: "other" as "business" | "project" | "personal" | "creative" | "other",
    priority: "medium" as "low" | "medium" | "high",
    image: null as File | null
  });