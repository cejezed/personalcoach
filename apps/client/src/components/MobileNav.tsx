import { NavLink } from "react-router-dom";
import { Home, Clock, CheckSquare, Heart, Lightbulb } from "lucide-react";

const mobileNavigation = [
  { name: "Home", to: "/", icon: Home },
  { name: "Time", to: "/time", icon: Clock },
  { name: "Tasks", to: "/tasks", icon: CheckSquare },
  { name: "Ideas", to: "/ideas", icon: Lightbulb },
  { name: "Health", to: "/health", icon: Heart },
];

export default function MobileNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="grid grid-cols-5 h-16">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
              data-testid={`mobile-link-${item.name.toLowerCase()}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}