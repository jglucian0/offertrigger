import { AppLayout } from "@/components/AppLayout";
import { OfferTable } from "@/components/OfferTable";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOffers } from "@/hooks/useOffers";

const Ofertas = () => {
  const { data, loading, refresh } = useOffers();


  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Ofertas</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Histórico de todas as ofertas coletadas
          </p>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="space-y-10">
        {data.length === 0 ? (
          <OfferTable offers={[]} />
        ) : (
          data.map((section: any) => (
            <div key={section.niche}>
              <h2 className="text-lg font-semibold mb-4">
                {section.niche}
              </h2>

              <OfferTable offers={section.offers} />
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default Ofertas;
