import { NavLink as RouterNavLink } from "react-router-dom";
const logoImg = new URL("../assets/logo_garimpei.png", import.meta.url).href;
import { cn } from "@/lib/utils";

import {
  LayoutDashboard,
  ShoppingBag,
  Smartphone,
  Send,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/ofertas", icon: ShoppingBag, label: "Ofertas" },
  { to: "/sessoes", icon: Smartphone, label: "Whatsapp" },
  { to: "/disparos", icon: Send, label: "Disparos" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
];

export const AppSidebar = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center">
          <img
            src={logoImg}
            alt="Garimpei! Logo"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">Sistema Garimpei!</h1>
          <p className="text-[10px] font-mono text-muted-foreground">v1.0.0 • online</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </RouterNavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="status-dot status-dot-connected" />
          <span>Status do sistema</span>
        </div>
      </div>
    </aside>
  );
};
