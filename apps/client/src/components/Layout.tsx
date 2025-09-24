import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { 
  Bell, 
  ChevronDown, 
  User as UserIcon,
  Search,
  Settings,
  LogOut,
  Moon,
  Sun
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  user: User;
}

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/': 'Dashboard',
    '/time': 'Time Tracking',
    '/tasks': 'Tasks',
    '/ideas': 'Ideas',
    '/budgets': 'Budgets',
    '/invoices': 'Invoices',
    '/health': 'Health',
    '/coach': 'Coach',
    '/backup': 'Backup',
  };
  
  return routes[pathname] || 'Dashboard';
};

const getPageDescription = (pathname: string): string => {
  const descriptions: Record<string, string> = {
    '/': 'Overzicht van je projecten en activiteiten',
    '/time': 'Registreer en beheer je gewerkte uren',
    '/tasks': 'Beheer je taken en to-do lijst',
    '/ideas': 'Verzamel en organiseer je ideeën',
    '/budgets': 'Beheer projectbudgetten en kosten',
    '/invoices': 'Creëer en verstuur facturen',
    '/health': 'Monitor je welzijn en gezondheid',
    '/coach': 'AI-assistentie en begeleiding',
    '/backup': 'Data backup en synchronisatie',
  };
  
  return descriptions[pathname] || 'Welkom bij Coach App';
};

export default function Layout({ children, user }: LayoutProps) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const pageDescription = getPageDescription(location.pathname);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    // Deze functie zou geïmporteerd moeten worden uit je auth context
    // Voor nu als placeholder
    console.log('Sign out');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar />
      <MobileNav />
      
      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Enhanced Top Header */}
        <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
          <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
            <div className="flex h-20 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-0">
              <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                {/* Page Title Section */}
                <div className="relative flex flex-1 items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <div className="w-5 h-5 bg-white rounded-sm"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 truncate">
                          {pageTitle}
                        </h1>
                        <p className="text-sm text-slate-600 truncate">
                          {pageDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-x-3 lg:gap-x-4">
                  {/* Search */}
                  <div className="hidden lg:block">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Zoeken..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="button-notifications"
                    >
                      <span className="sr-only">View notifications</span>
                      <Bell className="h-5 w-5" />
                      {/* Notification Badge */}
                      <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <h3 className="text-sm font-semibold text-slate-900">Meldingen</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            Geen nieuwe meldingen
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Theme Toggle */}
                  <button
                    type="button"
                    className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Toggle theme</span>
                    <Sun className="h-5 w-5" />
                  </button>

                  <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true"></div>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center gap-x-3 px-3 py-2 text-sm font-medium leading-6 text-slate-700 hover:bg-slate-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="button-profile"
                    >
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="hidden lg:flex lg:items-center">
                        <span className="text-sm font-medium text-slate-900" aria-hidden="true">
                          {user.email?.split('@')[0] || 'User'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
                      </span>
                    </button>

                    {/* Profile Dropdown Menu */}
                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900">
                            {user.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        
                        <div className="py-1">
                          <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                            <Settings className="mr-3 h-4 w-4" />
                            Instellingen
                          </button>
                          <button 
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            Uitloggen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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

      {/* Click outside handlers */}
      {(showProfileDropdown || showNotifications) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowProfileDropdown(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
}