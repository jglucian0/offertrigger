import { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-background md:overflow-x-hidden">
      <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={`min-h-screen transition-all duration-300 pt-16 md:pt-0 ${collapsed ? "md:ml-[4.3rem]" : "md:ml-60"
          }`}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div >
  );
};