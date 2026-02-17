import { AppLayout } from "@/components/AppLayout";
import { Settings, Database, Clock, Globe } from "lucide-react";

const Configuracoes = () => {
  const configSections = [
    {
      icon: Globe,
      title: "ScraperService",
      description: "Configurações do Puppeteer e cookies de autenticação",
      items: [
        { label: "Intervalo de coleta", value: "5 minutos" },
        { label: "Lista social ativa", value: "Favoritos ML" },
        { label: "Stealth Plugin", value: "Ativo" },
      ],
    },
    {
      icon: Database,
      title: "Banco de Dados",
      description: "SQLite com controle de duplicidade por product_id",
      items: [
        { label: "Total de registros", value: "1.247" },
        { label: "Pendentes de envio", value: "355" },
        { label: "Tamanho do DB", value: "4.2 MB" },
      ],
    },
    {
      icon: Clock,
      title: "Worker Disparador",
      description: "Ciclo automático de envio de mensagens",
      items: [
        { label: "Ciclo de disparo", value: "5 minutos" },
        { label: "Último disparo", value: "14:30" },
        { label: "Próximo disparo", value: "14:35" },
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Parâmetros do sistema de automação
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {configSections.map((section, i) => (
          <div
            key={section.title}
            className="stat-card animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-secondary p-2">
                  <section.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-xs font-semibold font-mono text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Configuracoes;