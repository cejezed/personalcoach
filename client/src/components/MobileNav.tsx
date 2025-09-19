import { Link, useLocation } from "wouter";
import { Home, Clock, CheckSquare, Heart, FileText } from "lucide-react";

const mobileNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Time", href: "/time", icon: Clock },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Health", href: "/health", icon: Heart },
  { name: "Invoices", href: "/invoices", icon: FileText },
];

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="grid grid-cols-5 h-16">
        {mobileNavigation.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`mobile-link-${item.name.toLowerCase()}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
