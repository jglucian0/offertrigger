import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  marketplace: any;
  onClose: () => void;
}

export const MarketplaceConfigDialog = ({
  open,
  marketplace,
  onClose
}: Props) => {
  const { toast } = useToast();
  const [tag, setTag] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open || !marketplace) return;

    const loadTag = async () => {
      try {
        if (marketplace.id === "mercadolivre") {
          const { data } = await api.get("/marketplace/mercadolivre/tag");

          if (data.tag) {
            setTag(data.tag);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar tag:", err);
      }
    };

    loadTag();
  }, [open, marketplace]);

  useEffect(() => {
    if (!open) {
      setTag("");
      setFile(null);
    }
  }, [open]);

  if (!marketplace) return null;



  const handleSave = async () => {
    try {
      if (!marketplace.enabled) {
        return toast({
          variant: "destructive",
          title: "Marketplace não ativado"
        });
      }

      // ===============================
      // MERCADO LIVRE (cookies + tag)
      // ===============================
      if (marketplace.type === "cookies+tag") {
        if (!tag) {
          return toast({
            variant: "destructive",
            title: "Tag obrigatória"
          });
        }

        const isFirstConfig = !marketplace.configured;

        // 🔴 Se for primeira configuração → arquivo obrigatório
        if (isFirstConfig && !file) {
          return toast({
            variant: "destructive",
            title: "Arquivo cookies.txt obrigatório na primeira configuração"
          });
        }

        // 🟢 Se enviou novo arquivo → faz upload
        if (file) {
          const formData = new FormData();
          formData.append("cookieFile", file);

          await api.post("/cookies/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });

          await api.post("/marketplace/mercadolivre/validate");
        }

        // ✅ Sempre salva a tag
        await api.post("/marketplace/mercadolivre/tag", {
          tag
        });
      }

      // ===============================
      // AMAZON (apiKey)
      // ===============================
      if (marketplace.type === "apiKey") {
        if (!tag) {
          return toast({
            variant: "destructive",
            title: "API Key obrigatória"
          });
        }

        await api.post("/marketplace/amazon/config", {
          apiKey: tag
        });
      }

      toast({
        title: "Configuração salva",
        description: `${marketplace.name} configurado com sucesso`
      });


      await api.post("/marketplace/config/status", {
        marketplace: marketplace.id,
        enabled: true,
        configured: true
      });

      onClose();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configuração"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            Configurar {marketplace.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {marketplace.type === "cookies+tag" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground">
                  Etiqueta em uso:
                </label>
                <Input
                  placeholder="Ex: garimpei"
                  value={tag}
                  className="mt-1"
                  onChange={(e) => setTag(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">
                  Upload do cookies.txt
                </label>
                <Input
                  type="file"
                  accept=".txt"
                  className="mt-1"
                  onChange={(e) =>
                    setFile(e.target.files ? e.target.files[0] : null)
                  }
                />
              </div>
            </>
          )}

          {marketplace.type === "apiKey" && (
            <div>
              <label className="text-xs text-muted-foreground">
                API Key
              </label>
              <Input
                placeholder="Sua API Key"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-primary">
            {marketplace.configured ? "Salvar Alterações" : "Salvar Configuração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};