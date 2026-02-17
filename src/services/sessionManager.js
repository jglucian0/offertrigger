const fs = require('fs');
const path = require('path');

const DEFAULT_SESSION_STATE = {
  status: 'starting',
  client: null,
  qrcode: null,
  interfaceReady: false
};

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.MAX_SESSIONS = 2;
  }

  createSession(userId) {
    if (this.sessions.has(userId)) return true;

    if (this.isLimitReached()) {
      console.log('Limite de sessões atingido');
      return false;
    }

    this.sessions.set(userId, this.createSessionState(userId));

    return true;
  }

  loadExistingSessions() {
    const tokensPath = this.getTokensPath();
    if (!fs.existsSync(tokensPath)) return;

    const users = fs.readdirSync(tokensPath);

    users.forEach(userId => {
      this.sessions.set(userId, this.createSessionState(userId));
    });
  }

  removeSession(userId) {
    if (!this.sessions.has(userId)) return;

    this.sessions.delete(userId);
  }

  getSession(userId) {
    return this.sessions.get(userId);
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  updateSession(userId, data) {
    const session = this.sessions.get(userId);
    if (!session) return;

    this.sessions.set(userId, { ...session, ...data });
  }

  isLimitReached() {
    return this.sessions.size >= this.MAX_SESSIONS;
  }

  createSessionState(userId) {
    return {
      id: userId,
      ...DEFAULT_SESSION_STATE
    };
  }

  getTokensPath() {
    return path.join(process.cwd(), 'tokens');
  }
}

module.exports = SessionManager;