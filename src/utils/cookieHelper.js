const fs = require('fs');
const path = require('path');
const { DEFAULT_MARKETPLACE_OWNER } = require('../config/appConfig');

async function loadCookies() {
  try {
    const filePath = resolveCookiePath();

    if (!fs.existsSync(filePath)) {
      console.warn('[CookieHelper] Arquivo não encontrado para user:', userId);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    const cookies = parseCookies(content);

    if (!cookies.length) {
      console.warn('[CookieHelper] Nenhum cookie válido encontrado');
      return [];
    }

    return cookies;


  } catch (error) {
    console.error('[CookieHelper] Erro ao carregar cookies:', error.message);
    return [];
  }
}

function resolveCookiePath() {
  return path.resolve(
    __dirname,
    `../../uploads/cookies/${DEFAULT_MARKETPLACE_OWNER}_mercadolivre.txt`
  );
}

function parseCookies(content) {
  return content
    .split('\n')
    .map(parseCookieLine)
    .filter(Boolean);
}

function parseCookieLine(line) {
  if (!line.trim() || line.startsWith('#')) return null;

  const parts = line.split('\t');
  if (parts.length < 7) return null;

  return {
    domain: parts[0],
    path: parts[2],
    secure: parts[3] === 'TRUE',
    expires: Number(parts[4]) || -1,
    name: parts[5],
    value: parts[6].trim(),
    httpOnly: false
  };
}

module.exports = { loadCookies };