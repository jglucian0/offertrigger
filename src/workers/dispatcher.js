require('dotenv').config();

const { manager, wppService } = require('../controllers/sessionController');
const DispatchQueue = require('../repositories/dispatchQueueRepository');
// const nicheGroups = require('../config/nicheGroups');
const { getConfig } = require('../config/dispatchStore');
const nicheGroupService = require('../services/nicheGroupService')

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

function startDispatchLoops() {
  Object.keys(getConfig()).forEach(startNicheDispatcher);
}

function startNicheDispatcher(niche) {
  console.log(`📦 Dispatcher ativo para ${niche}`);

  let lastSent = 0;

  setInterval(() => dispatchNiche(niche, () => lastSent, v => lastSent = v), 2000);
}

async function dispatchNiche(niche, getLastSent, setLastSent) {
  const cfg = getConfig()[niche];
  if (!cfg) return;

  if (!dentroHorario(cfg)) return;

  const now = Date.now();
  const interval = withJitter(cfg.interval);

  if (now - getLastSent() < interval) return;

  setLastSent(now);

  try {
    const offer = await DispatchQueue.getNext(niche);
    if (!offer) return;

    const groups = await nicheGroupService.getGroups(niche)

    for (const groupId of groups) {
      console.log(`[${niche}] Enviando "${offer.product_name}" para o grupo: ${groupId}`);
      await wppService.sendImage(
        USER_ID,
        groupId,
        offer.image_url,
        offer.message_text
      )
    }

    await DispatchQueue.markSent(offer.id);
  } catch (err) {
    console.error(`[${niche}] erro:`, err.message);
  }
}

waitForSession();