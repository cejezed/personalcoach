import { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { Bell, ChevronDown, User as UserIcon } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  user: User;
}

export default function Layout({ children, user }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      
      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
          <div className="flex h-16 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="relative flex flex-1">
                <div className="flex items-center">
                  <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                </div>
              </div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <button
                  type="button"
                  className="relative p-2 text-muted-foreground hover:text-foreground"
                  data-testid="button-notifications"
                >
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-6 w-6" />
                </button>
                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true"></div>
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-x-4 px-6 py-3 text-sm font-medium leading-6 text-foreground lg:px-0"
                    data-testid="button-profile"
                  >
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <span className="hidden lg:flex lg:items-center">
                      <span className="ml-4 text-sm font-medium leading-6 text-foreground" aria-hidden="true">
                        {user.email}
                      </span>
                      <ChevronDown className="ml-2 h-5 w-5 text-muted-foreground" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="lg:mx-auto lg:max-w-7xl lg:px-8 pb-20 lg:pb-8">
          <div className="px-4 py-8 sm:px-6 lg:px-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
