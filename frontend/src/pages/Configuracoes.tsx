import { AppLayout } from "@/components/AppLayout";
import { Settings, Globe, Plug } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketplaceConfigDialog } from "@/components/MarketplaceConfigDialog";

const marketplaces = [
  {
    id: "mercadolivre",
    name: "Mercado Livre",
    description: "Integração via Cookies",
    type: "cookies+tag",
    connected: false
  },
  {
    id: "amazon",
    name: "Amazon",
    description: "Integração via API Key",
    type: "apiKey",
    connected: false
  }
];

const Configuracoes = () => {
  const [selected, setSelected] = useState<any>(null);

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure seus marketplaces afiliados
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {marketplaces.map((mp, i) => (
          <div
            key={mp.id}
            className="stat-card animate-fade-in-up flex flex-col h-full min-h-[180px]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between gap-4 min-h-[56px]">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-secondary p-2">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="max-w-[140px]">
                    <h3 className="text-sm font-semibold text-foreground ">
                      {mp.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground ">
                      {mp.description}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={`text-[10px] ${mp.connected
                    ? "bg-success/20 text-success"
                    : "bg-secondary text-muted-foreground"
                    }`}
                >
                  {mp.connected ? "Conectado" : "Não configurado"}
                </Badge>
              </div>

              <div className="mt-auto pt-5">
                <Button
                  size="sm"
                  onClick={() => setSelected(mp)}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plug className="h-3.5 w-3.5" />
                  {mp.connected ? "Editar Configuração" : "Configurar"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MarketplaceConfigDialog
        open={!!selected}
        marketplace={selected}
        onClose={() => setSelected(null)}
      />
    </AppLayout>
  );
};

export default Configuracoes;