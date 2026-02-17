import { useEffect } from "react";
import { useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Smartphone, QrCode, MessageSquare, Users,
  Trash2, RefreshCw, Plus, Wifi, WifiOff, AlertTriangle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: string;
  name: string;
  status: "connected" | "qrcode" | "disconnected" | "loading";
  groups: number;
  messagesSent: number;
  lastActivity: string;
  qrcode?: string;
}



const MAX_SESSIONS = 2;

const statusConfig = {
  connected: { label: "Conectado", dot: "status-dot-connected", color: "text-success", icon: Wifi },
  qrcode: { label: "Leitura do QR Code", dot: "status-dot-pending", color: "text-primary", icon: QrCode },
  loading: {
    label: "Restaurando sessão",
    dot: "status-dot-pending",
    color: "text-muted-foreground",
    icon: RefreshCw,
  },
  disconnected: { label: "Desconectado", dot: "status-dot-disconnected", color: "text-destructive", icon: WifiOff }
};

export const SessionGrid = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const canAddSession = sessions.length < MAX_SESSIONS;

  useEffect(() => {
    const loadSessions = async () => {
      const { data } = await api.get("/session/list");

      setSessions(
        data.map((s: any) => ({
          id: s.id,
          name: s.id,
          status:
            s.status === "connected"
              ? "connected"
              : s.qrcode
                ? "qrcode"
                : "loading",
          groups: 0,
          messagesSent: 0,
          lastActivity: s.status === "connected" ? "Agora" : "Aguardando scan",
          qrcode: s.qrcode,
        }))
      );
    };

    loadSessions();
  }, []);

  const handleDelete = async (id: string) => {
    await api.delete(`/session/${id}`);

    setSessions((prev) => prev.filter((s) => s.id !== id));

    toast({
      title: "Sessão removida",
      description: "Instância eliminada.",
    });
  };

  const handleReconnect = async (id: string) => {
    setReconnecting(id);

    await api.post("/session/start", { userId: id });

    fetchSession(id);

    setReconnecting(null);
  };

  const handleAddSession = async () => {
    if (!canAddSession) return;

    const userId = prompt("Nome da sessão");

    if (!userId) return;

    await api.post("/session/start", { userId });

    toast({
      title: "Sessão criada",
      description: "Aguardando QR Code...",
    });

    fetchSession(userId);
  };

  const fetchSession = async (userId: string) => {
    const { data } = await api.get(`/session/status/${userId}`);

    const connected =
      data.status === "connected" ||
      data.status === "inChat";

    setSessions((prev) => {
      const exists = prev.find((s) => s.id === userId);

      const statusValue: Session["status"] =
        connected
          ? "connected"
          : data.qrcode
            ? "qrcode"
            : "loading";

      const payload: Session = {
        id: userId,
        name: userId,
        status: statusValue,
        groups: 0,
        messagesSent: 0,
        lastActivity: connected
          ? "Agora"
          : data.qrcode
            ? "Aguardando scan"
            : "Restaurando sessão",
        qrcode: connected ? undefined : data.qrcode,
      };

      if (exists) {
        return prev.map((s) =>
          s.id === userId ? { ...s, ...payload } : s
        );
      }

      return [...prev, payload];
    });
  };

  useEffect(() => {
    if (!sessions.length) return;

    const interval = setInterval(() => {
      sessions.forEach((s) => fetchSession(s.id));
    }, 3000);

    return () => clearInterval(interval);
  }, [sessions]);


  return (
    <div className="space-y-6">
      {/* Limit info */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{sessions.length}/{MAX_SESSIONS}</span> sessões utilizadas
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleAddSession}
          disabled={!canAddSession}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Sessão
        </Button>
      </div>

      {/* Sessions grid */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Smartphone className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Nenhuma sessão ativa</p>
          <p className="text-xs text-muted-foreground mt-1">Crie uma nova sessão para começar a disparar mensagens</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sessions.map((session, i) => {
            const status = statusConfig[session.status];
            const StatusIcon = status.icon;
            const isReconnecting = reconnecting === session.id;

            return (
              <div
                key={session.id}
                className={cn(
                  "stat-card animate-fade-in-up",
                  session.status === "connected" && "border-success/20"
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "rounded-lg p-2.5",
                        session.status === "connected" ? "bg-success/10" : "bg-secondary"
                      )}>
                        <StatusIcon className={cn("h-5 w-5", status.color)} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{session.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("status-dot", status.dot)} />
                          <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="secondary" className="bg-secondary text-muted-foreground border-0 font-mono text-[10px]">
                      ID: {session.id.slice(0, 6)}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 rounded-lg bg-secondary/50 px-3 py-2.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xl font-bold text-foreground mono">{session.groups}</p>
                        <p className="text-[10px] text-muted-foreground">Grupos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg bg-secondary/50 px-3 py-2.5">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xl font-bold text-foreground mono">{session.messagesSent}</p>
                        <p className="text-[10px] text-muted-foreground">Enviadas</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-[10px] text-muted-foreground">
                    Última atividade: {session.lastActivity}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex justify-between gap-2 border-t border-border pt-4">
                    {session.status === "disconnected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReconnect(session.id)}
                        disabled={isReconnecting}
                        className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs h-9"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isReconnecting && "animate-spin")} />
                        {isReconnecting ? "Reconectando..." : "Reconectar"}
                      </Button>
                    )}

                    {session.status === "loading" && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Aguarde carregando sessão...
                      </p>
                    )}

                    {session.status === "qrcode" && session.qrcode && (
                      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4">

                        <img
                          src={session.qrcode}
                          className="w-48 rounded-lg border bg-white p-2"
                        />

                        <p className="text-[10px] text-muted-foreground text-center" >
                          Abra o WhatsApp em seu celular e escaneie o QR Code
                        </p>

                      </div>
                    )}

                    {session.status === "connected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 border-success/30 text-success hover:bg-success/10 text-xs h-9 cursor-default"
                        disabled
                      >
                        <Wifi className="h-3.5 w-3.5" />
                        Sessão ativa
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs h-9"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Eliminar {session.name}?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Esta ação irá remover permanentemente a sessão, seus tokens e histórico de mensagens. Será necessário reconectar via QR Code.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-muted-foreground hover:bg-secondary">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar sessão
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
