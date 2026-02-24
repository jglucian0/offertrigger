import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export const useDispatchQueue = (sessionId: string | null, niche: string | null) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    const load = async () => {

      setLoading(true)

      try {
        if (!sessionId) {
          const sessionsRes = await api.get("/session/list")

          const results = await Promise.all(
            sessionsRes.data.map((s: any) =>
              niche
                ? api.get(`/dispatch/queue/${s.id}/${niche}`)
                : api.get(`/dispatch/queue/${s.id}`)
            )
          )

          const merged = results.flatMap(r =>
            Array.isArray(r.data) ? r.data : []
          )

          setData(merged)
        } else {
          const url = niche
            ? `/dispatch/queue/${sessionId}/${niche}`
            : `/dispatch/queue/${sessionId}`

          const res = await api.get(url)
          setData(Array.isArray(res.data) ? res.data : [])
        }
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