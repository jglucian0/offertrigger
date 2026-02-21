import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export const useDispatchQueue = (sessionId: string, niche: string | null) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    if (!sessionId) return

    const load = async () => {
      setLoading(true)

      try {
        const url = niche
          ? `/dispatch/queue/${sessionId}/${niche}`
          : `/dispatch/queue/${sessionId}`

        const res = await api.get(url)

        const items = (Array.isArray(res.data) ? res.data : []).map((item: any) => ({
          ...item,
          image_url: item.image_url
        }))

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