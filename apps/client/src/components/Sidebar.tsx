// apps/client/src/components/Sidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Clock,
  CheckSquare,
  DollarSign,
  FileText,
  Heart,
  Bot,
  Download,
  BarChart3,
  User,
  Folder,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const navigation = [
  { name: "Dashboard", to: "/", icon: Home },
  { name: "Time Tracking", to: "/time", icon: Clock },
  { name: "Tasks", to: "/tasks", icon: CheckSquare },
  { name: "Projecten", to: "/projecten", icon: Folder },
  { name: "Budgets", to: "/budgets", icon: DollarSign },
  { name: "Invoices", to: "/invoices", icon: FileText },
  { name: "Health", to: "/health", icon: Heart },
  { name: "Coach", to: "/coach", icon: Bot },
  { name: "Backup", to: "/backup", icon: Download },
];

export default function Sidebar() {
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4 border-r border-border">
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-xl font-semibold text-foreground">Coach App</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <NavLink
                        to={item.to}
                        end={item.to === "/"}
                        className={({ isActive }) =>
                          `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium ${
                            isActive
                              ? "bg-secondary text-secondary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`
                        }
                        data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.name}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </li>

            <li className="mt-auto">
              <div className="flex items-center justify-between px-2 py-3 text-sm font-medium leading-6 text-muted-foreground">
                <div className="flex items-center gap-x-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true" className="text-sm">
                    Signed in
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-sign-out"
                >
                  Sign out
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
