class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.MAX_SESSIONS = 5;
  }

  createSession(userId) {
    // Regra de negócio: Limite de 5 instâncias para controle de custo (RAM)
    if (this.sessions.size >= this.MAX_SESSIONS) {
      console.log('Limite de sessões atingido');
      return false;
    }

    const sessionData = {
      id: userId,
      status: 'starting',
      client: null, // Aqui entrará a instância do WPPConnect depois
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