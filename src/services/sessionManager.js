const fs = require('fs');
const path = require('path');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.MAX_SESSIONS = 2;
  }

  createSession(userId) {
    if (this.sessions.has(userId)) return true;

    if (this.sessions.size >= this.MAX_SESSIONS) {
      console.log('Limite de sessões atingido');
      return false;
    }

    this.sessions.set(userId, {
      id: userId,
      status: 'starting',
      client: null,
      qrcode: null,
      interfaceReady: false
    });

    return true;
  }

  loadExistingSessions() {
    const tokensPath = path.join(process.cwd(), 'tokens');

    if (!fs.existsSync(tokensPath)) return;

    const users = fs.readdirSync(tokensPath);

    for (const userId of users) {
      console.log(`[Session] Restaurando sessão: ${userId}`);

      this.sessions.set(userId, {
        id: userId,
        status: 'starting',
        client: null,
        qrcode: null,
        interfaceReady: false
      });
    }
  }

  removeSession(userId) {
    if (this.sessions.has(userId)) {
      this.sessions.delete(userId);
      console.log(`[Manager] Sessão removida: ${userId}`);
    }
  }

  getSession(userId) {
    return this.sessions.get(userId);
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  updateSession(userId, data) {
    const session = this.sessions.get(userId);
    if (session) {
      this.sessions.set(userId, { ...session, ...data });
    }
  }
}

module.exports = SessionManager;