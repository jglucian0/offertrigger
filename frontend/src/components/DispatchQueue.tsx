import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface DispatchItem {
  id: string;
  product_name: string;
  niche: string;
  status: "pending" | "sent" | "failed";
  sent_at?: string | null;
  created_at: string;
  sessionId?: string;
}

const statusMap = {
  pending: { icon: Clock, label: "Na fila", className: "bg-secondary text-muted-foreground" },
  sent: { icon: CheckCircle, label: "Enviado", className: "bg-success/10 text-success" },
  failed: { icon: AlertCircle, label: "Falha", className: "bg-destructive/10 text-destructive" },
};

interface Props {
  sessionId: string | "all";
  selectedNiche: string | null;
}


export const DispatchQueue = ({ sessionId, selectedNiche }: Props) => {
  const [history, setHistory] = useState<DispatchItem[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {

        if (sessionId === "all") {

          const sessionsRes = await api.get("/session/list")

          const results = await Promise.all(
            sessionsRes.data.map((s: any) =>
              api.get(`/dispatch/history/${s.id}`)
            )
          )

          const merged = results.flatMap((res, index) =>
            res.data.map((item: any) => ({
              ...item,
              sessionId: sessionsRes.data[index].id
            }))
          )

          setHistory(merged)

        } else {

          const res = await api.get(`/dispatch/history/${sessionId}`)

          const withSession = res.data.map((item: any) => ({
            ...item,
            sessionId
          }))

          setHistory(withSession)
        }

      } catch (err) {
        console.error("Erro ao carregar histórico:", err)
      }
    }

    loadHistory()
    const interval = setInterval(loadHistory, 5000)
    return () => clearInterval(interval)

  }, [sessionId])


  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="min-w-[600px] space-y-2">
        {history.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum disparo registrado ainda.
          </p>
        )}

        {history.map((item, i) => {
          const st = statusMap[item.status];
          const Icon = st.icon;

          const time = item.sent_at
            ? new Date(item.sent_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
            : new Date(item.created_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });

          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/30 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    item.status === "sent"
                      ? "text-success"
                      : item.status === "failed"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.product_name}</p>
                  {selectedNiche !== null && (
                    <p className="text-[10px] text-muted-foreground">
                      → {item.niche}
                    </p>
                  )}

                  {sessionId === "all" && (
                    <p className="text-[10px] text-muted-foreground">
                      Sessão: {item.sessionId}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-mono text-muted-foreground">{time}</span>
                <Badge variant="secondary" className={cn("border-0 text-[10px]", st.className)}>
                  {st.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
