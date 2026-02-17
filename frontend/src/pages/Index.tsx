import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { OfferTable } from "@/components/OfferTable";
import { DispatchQueue } from "@/components/DispatchQueue";
import { ShoppingBag, Send, Smartphone, TrendingUp, Zap } from "lucide-react";

const Dashboard = () => {
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
          value="1.247"
          icon={ShoppingBag}
          trend={{ value: "+32 hoje", positive: true }}
        />
        <StatCard
          title="Mensagens Enviadas"
          value="892"
          icon={Send}
          trend={{ value: "+18 última hora", positive: true }}
        />
        <StatCard
          title="Sessões Ativas"
          value="1/2"
          icon={Smartphone}
          subtitle="2 conectadas • 1 aguardando"
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
          <OfferTable />
        </div>

        {/* Dispatch queue */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Fila de Disparos</h2>
            <span className="text-xs font-mono text-muted-foreground">ciclo: 5 min</span>
          </div>
          <DispatchQueue />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
