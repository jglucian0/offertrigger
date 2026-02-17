import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Trash2, Pencil } from "lucide-react";
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
  image_url: string;
  original_price: number;
  current_price: number;
  discount: number;
  free_shipping: boolean;
  sent: boolean;
  link: string;
}

export const OfferTable = ({ offers = [] }: { offers?: Offer[] }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<any>({});

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/offers/${id}`);

      toast({
        title: "Oferta removida",
        description: "O produto foi excluído da lista com sucesso.",
      });

      // Recarrega para atualizar a lista (ou você poderia filtrar o estado localmente)
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Não foi possível excluir a oferta.",
      });
    }
  };

  const handleEdit = async (offer: Offer) => {
    const payload = {
      product_name: form.product_name,
      original_price: form.original_price,
      current_price: form.current_price,
      discount: form.discount,
      free_shipping: form.free_shipping,
      sent: form.sent
    };

    await api.put(`/offers/${editing!.id}`, payload);

    window.location.reload();
  };


  if (offers.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="p-12 text-center text-muted-foreground text-sm">
          Ainda não há produtos na lista...
        </div>
      </div>
    );
  }

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
              Voltar para fila
            </div>

          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>

            <Button
              className="bg-primary"
              onClick={async () => {
                await handleEdit(editing!);
              }}
            >
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>


      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preço</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desconto</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frete</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {offers.map((offer, i) => (
              <tr
                key={offer.id}
                className="bg-card transition-colors hover:bg-secondary/30 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                      <img src={offer.image_url || "/placeholder.png"} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground max-w-[260px]">{offer.product_name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{offer.id}</p>
                    </div>
                  </div>
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
    </>
  );
};
