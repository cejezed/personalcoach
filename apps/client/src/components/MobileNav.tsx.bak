import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

type NavItem = { label: string; href: string };
type Props = {
  title?: string;
  items: NavItem[];
  /** verberg bestaande bottom nav op mobiel als die er is */
  hideBottomNavOnMobile?: boolean;
};

export default function MobileNav({
  title = "PersonalCoach",
  items,
  hideBottomNavOnMobile = true,
}: Props) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Body scroll lock wanneer drawer open is
  useEffect(() => {
    const el = document.documentElement; // <html> i.p.v. body is iets consistenter op mobile
    if (open) el.classList.add("overflow-hidden");
    else el.classList.remove("overflow-hidden");
    return () => el.classList.remove("overflow-hidden");
  }, [open]);

  // Verberg eventuele bestaande bottom nav bars op kleine schermen
  useEffect(() => {
    if (!hideBottomNavOnMobile) return;
    const sels = [".bottom-nav", ".mobile-bottom-nav"];
    const nodes: HTMLElement[] = [];
    const prev: string[] = [];
    sels.forEach((sel) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((n) => {
        nodes.push(n);
        prev.push(n.style.display);
        n.style.display = "none";
      });
    });
    return () => nodes.forEach((n, i) => (n.style.display = prev[i] ?? ""));
  }, [hideBottomNavOnMobile]);

  return (
    <>
      {/* Sticky top bar (alleen zichtbaar op mobiel; desktop heeft Sidebar) */}
      <header
        className="sticky top-0 z-40 flex h-14 items-center gap-3 px-3
                   bg-white/95 backdrop-blur-xl border-b border-slate-200/60
                   lg:hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="grid place-items-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </button>

        <div className="text-base font-bold tracking-tight text-slate-900">
          {title}
        </div>

        <div className="ml-auto" />
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer (links) */}
      <nav
        aria-label="Mobiel menu"
        className={`fixed inset-y-0 left-0 z-50 w-[84vw] max-w-[340px] bg-white
                    shadow-2xl border-r border-slate-100 lg:hidden
                    transition-transform duration-200
                    ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100">
          <button
            aria-label="Sluit menu"
            onClick={() => setOpen(false)}
            className="grid place-items-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
          <span className="text-sm font-semibold text-slate-900">Menu</span>
        </div>

        <ul className="grid gap-2 p-2 max-h-[calc(100dvh-56px)] overflow-y-auto">
          {items.map((it) => {
            const active =
              pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <li key={it.href}>
                <Link
                  to={it.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "block rounded-xl px-3 py-3 text-sm",
                    "bg-slate-50 hover:bg-slate-100 text-slate-900",
                    active ? "ring-2 ring-indigo-500 bg-indigo-50" : "",
                  ].join(" ")}
                >
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto px-3 py-3 border-t border-slate-100 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} PersonalCoach
        </div>
      </nav>
    </>
  );
}
