class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.MAX_SESSIONS = 2;
  }

  createSession(userId) {
    // Regra de negócio: Limite de 2 instâncias para controle de custo (RAM)
    if (this.sessions.size >= this.MAX_SESSIONS) {
      console.log('Limite de sessões atingido');
      return false;
    }

    const sessionData = {
      id: userId,
      status: 'starting',
      client: null,
      qrcode: null
    };

    this.sessions.set(userId, sessionData);
    return true;
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