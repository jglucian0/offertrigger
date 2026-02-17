import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DispatchItem {
  id: string;
  offerTitle: string;
  targetGroup: string;
  status: "pending" | "sent" | "failed";
  scheduledAt: string;
}

const mockDispatches: DispatchItem[] = [
  { id: "1", offerTitle: "Fone JBL Tune 520BT", targetGroup: "Ofertas Tech", status: "sent", scheduledAt: "14:30" },
  { id: "2", offerTitle: "Smartwatch Xiaomi Redmi Watch 4", targetGroup: "Promoções do Dia", status: "pending", scheduledAt: "14:35" },
  { id: "3", offerTitle: "Câmera Intelbras IM5", targetGroup: "Ofertas Tech", status: "pending", scheduledAt: "14:35" },
  { id: "4", offerTitle: "Kit 3 Camisetas Premium", targetGroup: "Moda & Estilo", status: "sent", scheduledAt: "14:25" },
  { id: "5", offerTitle: "Mouse Gamer Logitech G203", targetGroup: "Ofertas Tech", status: "failed", scheduledAt: "14:20" },
  { id: "6", offerTitle: "Echo Dot 5ª Geração", targetGroup: "Casa Inteligente", status: "pending", scheduledAt: "14:40" },
];

const statusMap = {
  pending: { icon: Clock, label: "Na fila", className: "bg-secondary text-muted-foreground" },
  sent: { icon: CheckCircle, label: "Enviado", className: "bg-success/10 text-success" },
  failed: { icon: AlertCircle, label: "Falha", className: "bg-destructive/10 text-destructive" },
};

export const DispatchQueue = () => {
  return (
    <div className="space-y-2">
      {mockDispatches.map((item, i) => {
        const st = statusMap[item.status];
        return (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/30 animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <st.icon className={cn("h-4 w-4 flex-shrink-0", item.status === "sent" ? "text-success" : item.status === "failed" ? "text-destructive" : "text-muted-foreground")} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.offerTitle}</p>
                <p className="text-[10px] text-muted-foreground">→ {item.targetGroup}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs font-mono text-muted-foreground">{item.scheduledAt}</span>
              <Badge variant="secondary" className={cn("border-0 text-[10px]", st.className)}>
                {st.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};
