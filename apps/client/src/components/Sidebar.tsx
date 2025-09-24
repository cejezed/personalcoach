import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Lightbulb,
  Home,
  FolderKanban,
  CheckSquare,
  Calendar,
  Settings,
  Timer,
  Wallet,
  HeartPulse,
  Bot,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <Home className="w-5 h-5" /> },
  { label: "Projecten", href: "/projects", icon: <FolderKanban className="w-5 h-5" /> },
    { label: "Uren", href: "/time", icon: <Timer className="w-5 h-5" /> },
      { label: "Budgetten", href: "/budgets", icon: <Wallet className="w-5 h-5" /> },
  { label: "Taken", href: "/tasks", icon: <CheckSquare className="w-5 h-5" /> },
  { label: "Ideas", href: "/ideas", icon: <Lightbulb className="w-5 h-5" /> },
     { label: "Gezondheid", href: "/health", icon: <HeartPulse className="w-5 h-5" /> },
  { label: "Agenda", href: "/calendar", icon: <Calendar className="w-5 h-5" /> },
    { label: "Coach", href: "/coach", icon: <Bot className="w-5 h-5" /> },
   { label: "Instellingen", href: "/settings", icon: <Settings className="w-5 h-5" /> },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 bg-card border-r h-screen p-4 flex flex-col">
      <div className="text-xl font-bold mb-6">PersonalCoach</div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
