import { startBot } from "../services/wppService";
import { exec } from "child_process";

async function launch() {
  console.log("🚀 Iniciando motor do Garimpei!...");

  try {
    // 1. Garante que o banco está pronto (reaproveitando seu script de infra)
    console.log("📡 Aguardando banco de dados...");

    // 2. Inicia o Bot do WhatsApp
    console.log("🤖 Inicializando WppService...");
    await startBot();

    // 3. Inicia o servidor Next.js em modo de desenvolvimento ou produção
    const nextProcess = exec("npm run dev");

    nextProcess.stdout?.on("data", (data) => console.log(`[Next.js] ${data}`));
    nextProcess.stderr?.on("data", (data) => console.error(`[Next.js Error] ${data}`));

  } catch (error) {
    console.error("❌ Falha crítica no lançamento:", error);
    process.exit(1);
  }
}

launch();