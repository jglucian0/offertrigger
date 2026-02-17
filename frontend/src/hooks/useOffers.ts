import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useOffers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(() => {
    setLoading(true);

    api.get("/offers").then(res => {
      const normalized = res.data.map((section: any) => ({
        niche: section.niche,
        offers: section.offers.map((o: any) => ({
          id: o.id,
          product_name: o.product_name,
          image_url: `http://localhost:3001/storage/offers/${o.image_url.split('/').pop()}`,
          link: o.link,
          original_price: Number(o.original_price),
          current_price: Number(o.current_price),
          discount: Number(o.discount),
          free_shipping: o.free_shipping,
          sent: Boolean(o.sent)
        }))
      }));

      setData(normalized);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return {
    data,
    loading,
    refresh: fetchOffers
  };
}
