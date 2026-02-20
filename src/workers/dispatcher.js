require('dotenv').config();

const { manager, wppService } = require('../controllers/sessionController');
const DispatchQueue = require('../repositories/dispatchQueueRepository');
// const nicheGroups = require('../config/nicheGroups');
// const { getConfig } = require('../../quarentena/dispatchStore');
const nicheGroupService = require('../services/nicheGroupService')
const nicheDispatchConfigRepository = require('../repositories/nicheDispatchConfigRepository');

const USER_ID = "garimpei";

let started = false;

const runningSessions = new Set();

console.log(`📦 Dispatcher rodando, aguardando conexão da sessão...`);

function dentroHorario(cfg) {
  const start = cfg.start_time || "00:00";
  const end = cfg.end_time || "23:59";

  if (!start || !end) return true; // fallback segurança

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

async function startSessionDispatch(sessionId) {
  while (true) {
    await dispatchSession(sessionId);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function dispatchSession(sessionId) {
  if (runningSessions.has(sessionId)) {
    return;
  }

  runningSessions.add(sessionId);

  try {
    const configs = await nicheDispatchConfigRepository.getActiveBySession(sessionId);

    for (const cfg of configs) {
      if (cfg.paused) continue;
      if (!dentroHorario(cfg)) continue;

      const now = Date.now();
      const baseInterval = Number(cfg.interval_ms) || 60000;
      const interval = withJitter(baseInterval);

      const lastSent = Number(cfg.last_sent) || 0;

      if (now - lastSent < interval) continue;

      const offer = await DispatchQueue.getNext(sessionId, cfg.niche);
      if (!offer) continue;

      const groups = await nicheGroupService.getGroupsBySession(sessionId, cfg.niche);

      for (const groupId of groups) {
        await wppService.sendImage(
          sessionId,
          groupId,
          offer.image_url,
          offer.message_text
        );
      }

      await nicheDispatchConfigRepository.updateLastSent(sessionId, cfg.niche);
    }
  } catch (err) {
    console.error("Erro no dispatcher:", err);
  } finally {
    runningSessions.delete(sessionId);
  }


}

waitForSession();