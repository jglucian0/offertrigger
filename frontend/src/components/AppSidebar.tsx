import { NavLink as RouterNavLink } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const logoImg = new URL("../assets/logo_garimpei.png", import.meta.url).href;

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

interface Props {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

export const AppSidebar = ({ collapsed, setCollapsed }: Props) => {
  return (
    <aside
      className={cn(
        "z-40 bg-sidebar border-border transition-all duration-300 overflow-hidden",

        // MOBILE (default)
        "fixed top-0 left-0  w-full h-16 flex flex-row border-b",

        // DESKTOP (sobrescreve tudo)
        "md:fixed md:left-0 md:top-0 md:h-screen md:flex-col md:border-r md:border-b-0",
        collapsed ? "md:w-[4.3rem]" : "md:w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4 md:border-b border-border w-full">
        <div className="flex items-center justify-between w-full">

          {/* Logo + Nome */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center shrink-0">
              <img
                src={logoImg}
                alt="Garimpei! Logo"
                className="h-full w-full object-contain"
              />
            </div>

            {/* MOBILE */}
            <h1 className="text-sm font-bold text-foreground md:hidden">
              Garimpei!
            </h1>

            {/* DESKTOP */}
            <div
              className={cn(
                "hidden md:block transition-all duration-300 overflow-hidden whitespace-nowrap",
                collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
              )}
            >
              <h1 className="text-sm font-bold text-foreground">
                Sistema Garimpei!
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground">
                v1.0.0 • online
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Botão Colapsar (estilo item separado) */}
      <div className="md:px-3 md:py-3 border-b border-border">
        <div className="hidden md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />

            <span
              className={cn(
                "transition-all duration-300 overflow-hidden whitespace-nowrap",
                collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
              )}
            >
              Comprimir menu
            </span>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 md:flex-col md:space-y-1 md:px-3 md:py-4 md:gap-2 md:gap-0 mr-2">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-center md:justify-start rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4 shrink-0" />

              <span className={cn(
                "transition-all duration-300 overflow-hidden whitespace-nowrap hidden md:inline",
                collapsed ? "md:opacity-0 md:w-0" : "md:opacity-100 md:w-auto"
              )}>
                {item.label}
              </span>
            </div>
          </RouterNavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="hidden md:block border-t border-border p-4">
        <div className="flex ml-2 items-center text-xs text-muted-foreground relative">
          <div className="flex items-center gap-2">
            <span className="status-dot status-dot-connected shrink-0" />

            <span
              className={cn(
                "transition-all duration-300 overflow-hidden whitespace-nowrap",
                collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
              )}
            >
              Status do sistema
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};