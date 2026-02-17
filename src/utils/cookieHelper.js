const fs = require('fs');
const path = require('path');

const COOKIE_FILE = '../../www.mercadolivre.com.br_cookies.txt';
const ESSENTIAL_COOKIES = ['ssid', '_d2id', '_dsid', 'cp'];

async function loadCookies() {
  try {
    const filePath = resolveCookiePath();

    if (!fs.existsSync(filePath)) {
      logMissingFile(filePath);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    const cookies = parseCookies(content);

    return filterEssentialCookies(cookies);
  } catch (error) {
    console.error('[CookieHelper] Erro ao processar cookies:', error.message);
    return [];
  }
}

function resolveCookiePath() {
  return path.resolve(__dirname, COOKIE_FILE);
}

function logMissingFile(filePath) {
  console.warn('[CookieHelper] Arquivo de cookies não encontrado em:', filePath);
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
    name: parts[5],
    value: parts[6].trim(),
    domain: parts[0],
    path: parts[2],
    secure: parts[3] === 'TRUE',
    httpOnly: parts[1] === 'TRUE'
  };
}

function filterEssentialCookies(cookies) {
  return cookies.filter(cookie =>
    ESSENTIAL_COOKIES.includes(cookie.name)
  );
}

module.exports = { loadCookies };