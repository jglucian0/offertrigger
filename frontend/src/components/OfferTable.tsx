import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Trash2, Pencil, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export interface Offer {
  id: string;
  product_name: string;
  image_url?: string | null;
  niche?: string;
  original_price: number;
  current_price: number;
  discount: number;
  free_shipping: boolean;
  sent: boolean;
  link: string;
  sessionId?: string | null;
}

const getImageUrl = (fileName?: string) => {
  if (!fileName) return "/placeholder.png"
  return `${api.defaults.baseURL}/uploads/offers/${fileName}`
}

interface OfferTableProps {
  offers?: Offer[]
  onRefresh?: () => void
  niche?: string
}

export const OfferTable = ({ offers = [], onRefresh, niche }: OfferTableProps) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<any>({});
  const [migrating, setMigrating] = useState<Offer | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [isMigrating, setIsMigrating] = useState(false);
  const [internalOffers, setInternalOffers] = useState<Offer[]>(offers)
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/offers/${id}`);
      onRefresh?.();

      toast({
        title: "Oferta removida",
        description: "O produto foi excluído da lista com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Não foi possível excluir a oferta.",
      });
    }
  };

  const handleEdit = async () => {
    const payload = {
      product_name: form.product_name,
      original_price: form.original_price,
      current_price: form.current_price,
      discount: form.discount,
      free_shipping: form.free_shipping,
      sent: form.sent
    };

    await api.put(`/offers/${editing!.id}`, payload);
    onRefresh?.();
    setEditing(null);
  };

  useEffect(() => {
    setInternalOffers(offers)
  }, [offers])

  useEffect(() => {
    api.get("/session/list").then(res => {

      const normalized = res.data.map((s: any) => ({
        ...s,
        id: String(s.id)
      }));

      setSessions(normalized);
      setSessionsLoaded(true);
    });
  }, []);

  const sessionExists = (sessionId?: string | null) => {
    if (!sessionId) return false;
    if (!sessionsLoaded) return true;

    return sessions.some(
      (s) => s.id === String(sessionId)
    );
  };

  if (internalOffers.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="p-12 text-center text-muted-foreground text-sm">
          Ainda não há produtos na lista...
        </div>
      </div>
    );
  }

  const filteredOffers = niche
    ? internalOffers.filter(o => o.niche === niche)
    : internalOffers;

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <>
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar oferta</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">

            <Input
              value={form.product_name || ""}
              onChange={e => setForm({ ...form, product_name: e.target.value })}
            />

            <Input
              type="number"
              placeholder="Preço original"
              value={form.original_price}
              onChange={e => setForm({ ...form, original_price: Number(e.target.value) })}
            />

            <Input
              type="number"
              placeholder="Preço atual"
              value={form.current_price}
              onChange={e => setForm({ ...form, current_price: Number(e.target.value) })}
            />

            <Input
              type="number"
              placeholder="Desconto"
              value={form.discount}
              onChange={e => setForm({ ...form, discount: Number(e.target.value) })}
            />

            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.free_shipping}
                onCheckedChange={(v) => setForm({ ...form, free_shipping: v })}
              />
              Frete grátis
            </div>

            <div className="flex items-center gap-2 text-warning">
              <Checkbox
                checked={!form.sent}
                onCheckedChange={(v) =>
                  setForm({ ...form, sent: !v })
                }
              />
              Adicionar à fila
            </div>

          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>

            <Button
              className="bg-primary"
              onClick={handleEdit}
            >
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>

      <Dialog open={!!migrating} onOpenChange={() => setMigrating(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Migrar oferta</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">

            <div className="text-sm text-muted-foreground">
              Produto:
              <span className="block font-medium text-foreground mt-1 truncate">
                {migrating?.product_name}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nova sessão
              </label>

              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecione uma sessão</option>

                {sessions.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.id}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setMigrating(null)}>
              Cancelar
            </Button>

            <Button
              className="bg-primary"
              disabled={!selectedSession || isMigrating}
              onClick={async () => {
                try {
                  setIsMigrating(true);

                  await api.put(`/offers/${migrating!.id}/migrate`, {
                    newSessionId: selectedSession
                  });

                  toast({
                    title: "Oferta migrada com sucesso",
                    description: "O produto foi movido para a nova sessão.",
                  });

                  onRefresh?.();
                  setMigrating(null);

                } catch (error) {
                  toast({
                    title: "Erro ao migrar oferta",
                    description: "Não foi possível mover o produto.",
                    variant: "destructive",
                  });
                } finally {
                  setIsMigrating(false);
                }
              }}
            >
              {isMigrating ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border border-border w-full min-w-0">
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="min-w-[950px] w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sessão</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preço</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desconto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frete</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredOffers.map((offer, i) => (
                <tr
                  key={offer.id}
                  className={
                    !sessionExists(offer.sessionId)
                      ? "bg-destructive/10 border-l-4 border-destructive"
                      : "bg-card transition-colors hover:bg-secondary/30 animate-fade-in-up"
                  }
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <img
                          src={getImageUrl(offer.image_url)}
                          alt={offer.product_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground max-w-[260px]">{offer.product_name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{offer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {!sessionExists(offer.sessionId) && (
                      <span className="text-xs text-destructive font-semibold">
                        Sessão inexistente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {offer.original_price > 0 && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(offer.original_price)}
                      </p>
                    )}

                    {offer.current_price > 0 ? (
                      <p className="text-sm font-bold text-foreground mono">
                        {formatCurrency(offer.current_price)}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-mono font-bold border-0">
                      {offer.discount > 0 ? `-${offer.discount}%` : "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {offer.free_shipping ? (
                      <Badge variant="secondary" className="bg-success/10 text-success border-0 text-[10px]">GRÁTIS</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border-0 text-[10px] font-semibold",
                        offer.sent
                          ? "bg-success/10 text-success"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {offer.sent ? "Enviado" : "Na fila"}
                    </Badge>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(offer);
                          setForm({
                            ...offer,
                            sent: Boolean(offer.sent)
                          });
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setMigrating(offer);
                          setSelectedSession("");
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Repeat className="h-4 w-4" />
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Remover oferta?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Esta ação não pode ser desfeita. O produto "{offer.product_name}" será removido permanentemente da lista de ofertas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-secondary">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(offer.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover produto
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>


                  <td className="px-4 py-3 text-center">
                    <a href={offer.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-accent transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </td>
                </tr>

              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

