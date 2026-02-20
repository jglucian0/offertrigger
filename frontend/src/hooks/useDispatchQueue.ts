import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export const useDispatchQueue = (sessionId: string, niche: string | null) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!niche) return

    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/dispatch/queue/${sessionId}/${niche}`)

        const items = await Promise.all(
          (Array.isArray(res.data) ? res.data : []).map(async (item: any) => {
            return {
              ...item,
              image_url: item.image_url
                ? `http://localhost:3001/storage/offers/${item.image_url.split("/").pop()}`
                : null
            }
          })
        )

        setData(items)
      } catch (err) {
        console.error("Erro ao carregar fila:", err)
      } finally {
        setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)

  }, [sessionId, niche])

  return { data, loading }
}