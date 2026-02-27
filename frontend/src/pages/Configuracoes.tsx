import { AppLayout } from "@/components/AppLayout";
import { Settings, Globe, Plug } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MarketplaceConfigDialog } from "@/components/MarketplaceConfigDialog";
import { useEffect } from "react";
import { api } from "@/lib/api";


const Configuracoes = () => {

  const [marketplaces, setMarketplaces] = useState([
    {
      id: "mercadolivre",
      name: "Mercado Livre",
      description: "Integração via Cookies",
      type: "cookies+tag",
      enabled: false,
      configured: false
    },
    {
      id: "amazon",
      name: "Amazon",
      description: "Integração via API Key",
      type: "apiKey",
      enabled: false,
      configured: false
    }
  ]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const { data } = await api.get("/marketplace/config/status");

        setMarketplaces(prev =>
          prev.map(mp => {
            const dbConfig = data.find(
              (c: any) => c.marketplace === mp.id
            );

            if (!dbConfig) return mp;

            return {
              ...mp,
              enabled: dbConfig.enabled,
              configured: dbConfig.configured
            };
          })
        );

      } catch (err) {
        console.error("Erro ao carregar configs:", err);
      }
    };

    loadConfigs();
  }, []);

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
                  className={`text-[10px] ${mp.configured
                    ? "bg-success/20 text-success"
                    : "bg-secondary text-muted-foreground"
                    }`}
                >
                  {mp.configured ? "Conectado" : "Não configurado"}
                </Badge>
              </div>

              <div className="mt-auto pt-6">
                <div className="flex items-center justify-between gap-5">

                  <Button
                    disabled={!mp.enabled}
                    onClick={() => setSelected(mp)}
                    className="flex-1 h-10 gap-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    <Plug className="h-4 w-4" />
                    {mp.configured ? "Editar Configuração" : "Configurar"}
                  </Button>

                  <Switch
                    checked={mp.enabled}
                    onCheckedChange={(value) => {
                      setMarketplaces(prev =>
                        prev.map(m =>
                          m.id === mp.id ? { ...m, enabled: value } : m
                        )
                      );
                    }}
                    className="scale-110"
                  />

                </div>
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