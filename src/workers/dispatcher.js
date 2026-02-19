require('dotenv').config();

const { manager, wppService } = require('../controllers/sessionController');
const DispatchQueue = require('../repositories/dispatchQueueRepository');
// const nicheGroups = require('../config/nicheGroups');
const { getConfig } = require('../config/dispatchStore');
const nicheGroupService = require('../services/nicheGroupService')
const nicheDispatchConfigRepository = require('../repositories/nicheDispatchConfigRepository');

const USER_ID = "garimpei";

let started = false;

console.log(`📦 Dispatcher rodando, aguardando conexão da sessão...`);

function dentroHorario({ start, end }) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  const overnight = startMinutes > endMinutes;

  return overnight
    ? nowMinutes >= startMinutes || nowMinutes <= endMinutes
    : nowMinutes >= startMinutes && nowMinutes <= endMinutes;
}

function withJitter(base, percent = 0.2) {
  const jitter = (Math.random() * 2 - 1) * base * percent;
  return base + jitter;
}

function isSessionReady(session) {
  return (
    session &&
    session.client &&
    session.status === 'connected' &&
    session.interfaceReady
  );
}

function waitForSession() {
  const interval = setInterval(() => {
    if (started) return;

    const session = manager.getSession(USER_ID);

    if (!isSessionReady(session)) {
      return;
    }

    started = true;
    clearInterval(interval);

    startDispatchLoops();
  }, 3000);
}

async function startDispatchLoops() {
  const sessions = manager.getAllSessions();

  console.log("Sessions carregadas:", sessions);

  for (const session of sessions) {
    if (
      session.status === "connected" &&
      session.interfaceReady &&
      session.id
    ) {
      console.log("Iniciando dispatcher para:", session.id);
      startSessionDispatch(session.id);
    }
  }
}

function startSessionDispatch(sessionId) {
  setInterval(() => dispatchSession(sessionId), 2000);
}

// function startNicheDispatcher(niche) {
//   console.log(`📦 Dispatcher ativo para ${niche}`);

//   let lastSent = 0;

//   setInterval(() => dispatchNiche(niche, () => lastSent, v => lastSent = v), 2000);
// }

async function dispatchSession(sessionId) {
  console.log("🔄 Verificando sessão:", sessionId);

  const configs = await nicheDispatchConfigRepository.getActiveBySession(sessionId);

  console.log("Configs encontradas:", configs);

  for (const cfg of configs) {
    console.log("Processando niche:", cfg.niche);
    if (cfg.paused) continue;
    if (!dentroHorario(cfg)) continue;

    const now = Date.now();
    const interval = withJitter(cfg.interval);

    if (now - (cfg.last_sent || 0) < interval) continue;

    const offer = await DispatchQueue.getNext(sessionId, cfg.niche);
    if (!offer) continue;

    const groups = await nicheGroupService.getGroupsBySession(sessionId, cfg.niche);

    for (const groupId of groups) {
      console.log("Enviaria para:", sessionId, groupId);

      await wppService.sendImage(
        sessionId,
        groupId,
        offer.image_url,
        offer.message_text
      );
    }

    await nicheDispatchConfigRepository.updateLastSent(sessionId, cfg.niche);
    // await DispatchQueue.markSent(offer.id);
  }
}

waitForSession();