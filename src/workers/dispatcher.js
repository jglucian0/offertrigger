require('dotenv').config();

const { manager, wppService } = require('../controllers/sessionController');
const DispatchQueue = require('../repositories/dispatchQueueRepository');
const nicheGroups = require('../config/nicheGroups');
const { getConfig } = require('../config/dispatchStore');

const USER_ID = "cliente1";

let started = false;

function dentroHorario(cfg) {
  const now = new Date();

  const [sh, sm] = cfg.start.split(":").map(Number);
  const [eh, em] = cfg.end.split(":").map(Number);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  // Janela normal (ex: 09:00–18:00)
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }

  // Janela cruzando meia-noite (ex: 22:00–03:54)
  return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
}

function withJitter(base, percent = 0.2) {
  const delta = base * percent;
  return base + (Math.random() * delta * 2 - delta);
}

console.log("🚀 Dispatcher carregado, aguardando sessão cliente1...");

const waitSession = setInterval(() => {

  if (started) return;

  const session = manager.getSession(USER_ID);

  if (!session) {
    return;
  }

  if (session.status !== 'inChat' && session.status !== 'connected') {
    return;
  }

  if (!session.interfaceReady) {
    return;
  }

  console.log("✅ cliente1 em inChat, iniciando disparos");

  started = true;
  clearInterval(waitSession);

  startDispatchLoops();

}, 3000);

function startDispatchLoops() {

  Object.keys(nicheGroups).forEach(niche => {


    console.log(`📦 Dispatcher ativo para ${niche}`);

    let lastSent = 0;

    setInterval(async () => {

      const cfg = getConfig()[niche];
      if (!cfg) return;

      if (!dentroHorario(cfg)) {
        //console.log(`[${niche}] fora do horário`);
        return;
      }

      const now = Date.now();

      const realInterval = withJitter(cfg.interval, 0.25); // 25%

      if (now - lastSent < realInterval) return;

      lastSent = now;

      try {

        const offer = await DispatchQueue.getNext(niche);

        if (!offer) {
          //console.log(`[${niche}] fila vazia`);
          return;
        }

        console.log(`[${niche}] enviando: ${offer.product_name}`);

        await wppService.sendImage(
          USER_ID,
          nicheGroups[niche],
          offer.image_url,
          offer.message_text
        );

        await DispatchQueue.markSent(offer.id);

      } catch (err) {
        console.error(`[${niche}] erro:`, err.message);
      }

    }, 2000);
  });
}
