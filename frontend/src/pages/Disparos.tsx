import { AppLayout } from "@/components/AppLayout";
import { DispatchQueue } from "@/components/DispatchQueue";
import { StatCard } from "@/components/StatCard";
import { Send, Clock, CheckCircle, AlertCircle, Package, ExternalLink, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react"
import { NicheDispatchConfig } from "@/components/NicheDispatchConfig"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useDispatchQueue } from "@/hooks/useDispatchQueue"


const formatCurrency = (v?: number | null) => {
  if (v === null || v === undefined) return "R$ 0,00";

  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
};

const getImageUrl = (fileName?: string) => {
  if (!fileName) return "/placeholder.png"
  return `${api.defaults.baseURL}/uploads/offers/${fileName}`
}

const Disparos = () => {
  const sessionId = "garimpei"
  const { toast } = useToast();

  const [configs, setConfigs] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [stats, setStats] = useState({
    pending: 0,
    sent_today: 0,
    failures: 0
  })

  const { data: queue } = useDispatchQueue(sessionId, selectedNiche)

  const niches = Array.from(
    new Set(
      [
        ...groups.map(g => g.niche || "sem nicho definido"),
        ...configs.map(c => c.niche)
      ].filter(Boolean)
    )

  )

  useEffect(() => {
    const loadData = async () => {
      try {
        const [configsRes, groupsRes] = await Promise.all([
          api.get(`/dispatch/config/${sessionId}`),
          api.get(`/niche-groups/${sessionId}`)
        ])

        console.log("CONFIGS:", configsRes.data)
        console.log("GROUPS:", groupsRes.data)

        setConfigs(configsRes.data)
        setGroups(groupsRes.data)

      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      const res = await api.get(`/dispatch/stats/${sessionId}`)
      setStats(res.data)
    }

    loadStats()
    const interval = setInterval(loadStats, 5000)
    return () => clearInterval(interval)
  }, [])


  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Send className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Fila de Disparos</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Monitoramento de disparo automático (ciclo mínimo: 5 min)
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Na Fila" value={stats.pending} icon={Clock} />
        <StatCard title="Enviados Hoje" value={stats.sent_today} icon={CheckCircle} />
        <StatCard title="Falhas" value={stats.failures ?? 0} icon={AlertCircle} />
      </div>

      <div className="space-y-4 mb-8">

        {niches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <Settings className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">
              Nenhum nicho configurado
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre grupos e defina um nicho para iniciar os disparos
            </p>
          </div>
        ) : (
          niches.map(niche => {
            const cfg = configs.find(c => c.niche === niche);
            const nicheGroups = groups.filter(g => g.niche === niche);

            return (
              <NicheDispatchConfig
                key={niche}
                niche={niche}
                interval={Math.floor((Number(cfg?.interval_ms) || 300000) / 60000)}
                start={cfg?.start_time ?? "00:00"}
                end={cfg?.end_time ?? "23:59"}
                paused={cfg?.paused ?? true}
                groups={nicheGroups}
                onSave={async (data) => {
                  try {
                    await api.post("/dispatch/config", {
                      sessionId,
                      ...data,
                      interval: data.interval * 60000
                    });

                    toast({
                      title: "Configuração salva",
                      description: `Nicho "${data.niche}" atualizado.`,
                    });

                    const updated = await api.get(`/dispatch/config/${sessionId}`);
                    setConfigs(updated.data);

                  } catch (err) {
                    toast({
                      title: "Erro ao salvar",
                      description: "Não foi possível salvar.",
                      variant: "destructive",
                    });
                  }
                }}
                onDelete={async (niche) => {
                  try {
                    await api.delete(`/dispatch/config/${sessionId}/${niche}`);

                    toast({
                      title: "Nicho removido",
                      description: `O nicho "${niche}" foi excluído.`,
                    });

                    const updated = await api.get(`/dispatch/config/${sessionId}`);
                    setConfigs(updated.data);

                  } catch (err) {
                    toast({
                      title: "Erro ao excluir",
                      description: "Não foi possível remover o nicho.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            );
          })
        )}

      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pending products list */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Produtos na Lista de Envio</h2>
            </div>
            {queue.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-0 font-mono"
              >
                {queue.length} pendentes
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                variant={selectedNiche === null ? "default" : "outline"}
                onClick={() => setSelectedNiche(null)}
              >
                Todos
              </Button>

              {niches.map(n => (
                <Button
                  key={n}
                  size="sm"
                  variant={selectedNiche === n ? "default" : "outline"}
                  onClick={() => setSelectedNiche(n)}
                >
                  {n}
                </Button>
              ))}
            </div>

            {queue.map((product, i) => (
              <div
                key={product.id}
                className="stat-card animate-fade-in-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="relative z-10 flex gap-4">
                  {/* Image */}
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <img
                      src={getImageUrl(product.image_url)}
                      alt={product.product_name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{product.product_name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{product.id}</p>
                      </div>
                      <a
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-primary hover:text-accent transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    {/* Price row */}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-lg font-bold font-mono text-foreground">{formatCurrency(product.current_price)}</span>
                      <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.original_price)}</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-mono font-bold border-0 text-[10px]">
                        -{product.discount}%
                      </Badge>
                      {product.free_shipping && (
                        <Badge variant="secondary" className="bg-success/10 text-success border-0 text-[10px] gap-1">
                          <Truck className="h-3 w-3" />
                          Grátis
                        </Badge>
                      )}
                    </div>

                    {/* Target groups */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {selectedNiche !== null && (
                        <>
                          <span className="text-[10px] text-muted-foreground">Destino:</span>

                          {groups
                            .filter(g => g.active && g.niche === selectedNiche)
                            .map((group) => (
                              <Badge
                                key={group.id}
                                variant="secondary"
                                className="bg-secondary text-muted-foreground border-0 text-[10px] px-2 py-0"
                              >
                                {group.group_name}
                              </Badge>
                            ))}
                        </>
                      )}

                      <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                        adicionado às{" "}
                        {product.created_at &&
                          new Date(product.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch history */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Histórico</h2>
          </div>
          <DispatchQueue
            sessionId={sessionId}
            selectedNiche={selectedNiche} />
        </div>
      </div>


    </AppLayout>
  );
};

export default Disparos;
