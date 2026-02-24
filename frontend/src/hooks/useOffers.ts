import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useOffers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await api.get("/offers");

      const normalized = res.data.map((section: any) => ({
        niche: section.niche,
        offers: section.offers.map((o: any) => ({
          id: o.id,
          product_name: o.product_name,
          image_url: o.image_url,
          link: o.link,
          original_price: Number(o.original_price),
          current_price: Number(o.current_price),
          discount: Number(o.discount),
          free_shipping: o.free_shipping,
          sent: Boolean(o.sent),
          sessionId: o.session_id
        }))
      }));

      setData(prev => {
        if (JSON.stringify(prev) === JSON.stringify(normalized)) {
          return prev;
        }
        return normalized;
      });

    } catch (err) {
      console.error("Erro ao buscar offers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();

    const interval = setInterval(fetchOffers, 5000);

    return () => clearInterval(interval);
  }, [fetchOffers]);

  return {
    data,
    loading,
    refresh: fetchOffers
  };
}
