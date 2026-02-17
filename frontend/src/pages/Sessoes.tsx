import { AppLayout } from "@/components/AppLayout";
import { SessionGrid } from "@/components/SessionGrid";
import { Smartphone } from "lucide-react";

const Sessoes = () => {
  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Smartphone className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Sessões WhatsApp</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie suas instâncias de conexão — limite de 2 sessões por usuário
        </p>
      </div>
      <SessionGrid />
    </AppLayout>
  );
};

export default Sessoes;
