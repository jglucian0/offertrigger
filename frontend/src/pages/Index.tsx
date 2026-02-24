import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { OfferTable } from "@/components/OfferTable";
import { DispatchQueue } from "@/components/DispatchQueue";
import { ShoppingBag, Send, Smartphone, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

const Dashboard = () => {
  const MAX_SESSIONS = 2;

  const [stats, setStats] = useState({
    offers: 0,
    sent: 0,
    sessionsActive: 0,
    sessionsTotal: 0,
    offersToday: 0,
    sentLastHour: 0
  })

  const [offers, setOffers] = useState([])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const sessionsRes = await api.get("/session/list")
        const sessions = sessionsRes.data

        const sessionsActive = sessions.filter(
          (s: any) =>
            s.status === "connected" ||
            s.status === "inChat"
        ).length

        // ===== Mensagens enviadas hoje (já existia)
        const dispatchStats = await Promise.all(
          sessions.map((s: any) =>
            api.get(`/dispatch/stats/${s.id}`)
          )
        )

        const merged = dispatchStats.reduce(
          (acc, r) => ({
            sent: acc.sent + (r.data.sent_today || 0),
            pending: acc.pending + (r.data.pending || 0),
          }),
          { sent: 0, pending: 0 }
        )

        // ===== NOVO: mensagens enviadas na última hora
        const historyResults = await Promise.all(
          sessions.map((s: any) =>
            api.get(`/dispatch/history/${s.id}`)
          )
        )

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

        const sentLastHour = historyResults
          .flatMap(res => res.data)
          .filter((item: any) =>
            item.status === "sent" &&
            item.sent_at &&
            new Date(item.sent_at) >= oneHourAgo
          ).length

        setStats(prev => ({
          ...prev,
          sent: merged.sent,
          sessionsActive,
          sessionsTotal: MAX_SESSIONS,
          sentLastHour
        }))

      } catch (err) {
        console.error("Erro ao carregar stats:", err)
      }
    }

    const loadOffers = async () => {
      try {
        const offersRes = await api.get("/offers")

        const flattened = offersRes.data.flatMap((section: any) =>
          section.offers.map((o: any) => ({
            id: o.id,
            product_name: o.product_name,
            image_url: o.image_url,
            link: o.link,
            original_price: Number(o.original_price),
            current_price: Number(o.current_price),
            discount: Number(o.discount),
            free_shipping: o.free_shipping,
            sent: Boolean(o.sent),
            niche: section.niche,
            created_at: o.created_at,
            sessionId: o.session_id
          }))
        )

        const queueOnly = flattened.filter(o => !o.sent)
        const newData = queueOnly.slice(0, 10)

        // 👇 evita sobrescrever se nada mudou
        setOffers(prev => {
          if (JSON.stringify(prev) === JSON.stringify(newData)) {
            return prev
          }
          return newData
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const offersToday = flattened.filter((o: any) => {
          if (!o.created_at) return false
          return new Date(o.created_at) >= today
        }).length

        setStats(prev => ({
          ...prev,
          offers: flattened.length,
          offersToday
        }))

      } catch (err) {
        console.error("Erro ao carregar offers:", err)
      }
    }

    // carga inicial
    loadStats()
    loadOffers()

    // polling separado
    const statsInterval = setInterval(loadStats, 10000)
    const offersInterval = setInterval(loadOffers, 10000)

    return () => {
      clearInterval(statsInterval)
      clearInterval(offersInterval)
    }
  }, [])



  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Zap className="h-5 w-5 text-primary glow-text" />
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Monitoramento em tempo real do sistema
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ofertas Coletadas"
          value={stats.offers}
          icon={ShoppingBag}
          trend={{
            value: `+${stats.offersToday} hoje`,
            positive: stats.offersToday > 0
          }}
        />
        <StatCard
          title="Mensagens Enviadas"
          value={stats.sent}
          icon={Send}
          trend={{
            value: `+${stats.sentLastHour} última hora`,
            positive: stats.sentLastHour > 0
          }}
        />
        <StatCard
          title="Sessões Ativas"
          value={`${stats.sessionsActive}/${stats.sessionsTotal}`}
          icon={Smartphone}
          subtitle={`${stats.sessionsActive} ativas • ${stats.sessionsTotal - stats.sessionsActive} disponivel`}
        />
        <StatCard
          title="Taxa de Conversão (Em breve)"
          value="0.0%"
          icon={TrendingUp}
          trend={{ value: "+0.0% semana", positive: true }}
        />
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Offers table */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Últimas Ofertas</h2>
            <span className="text-xs font-mono text-muted-foreground">atualizado há 2 min</span>
          </div>
          <OfferTable
            offers={offers}
            onRefresh={async () => {
              const offersRes = await api.get("/offers")

              const flattened = offersRes.data.flatMap((section: any) =>
                section.offers.map((o: any) => ({
                  id: o.id,
                  product_name: o.product_name,
                  image_url: o.image_url,
                  link: o.link,
                  original_price: Number(o.original_price),
                  current_price: Number(o.current_price),
                  discount: Number(o.discount),
                  free_shipping: o.free_shipping,
                  sent: Boolean(o.sent),
                  niche: section.niche,
                  sessionId: o.session_id
                }))
              )

              const queueOnly = flattened.filter(o => !o.sent)
              setOffers(queueOnly.slice(0, 10))
            }} />
        </div>

        {/* Dispatch queue */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Fila de Disparos</h2>
            <span className="text-xs font-mono text-muted-foreground">ciclo: 5 min</span>
          </div>
          <DispatchQueue sessionId="all" selectedNiche={null} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
