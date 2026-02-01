const SessionManager = require('../services/sessionManager');

describe('SessionManager Service', () => {
  let sessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  test('Deve criar uma nova sessão para um usuário específico', () => {
    sessionManager.createSession('user-1');
    const session = sessionManager.getSession('user-1');

    expect(session).toBeDefined();
    expect(session.status).toBe('starting');
  });

  test('Não deve permitir mais de 5 sessões simultâneas (Limite de Custo)', () => {
    // Criamos 5 sessões
    for (let i = 1; i <= 5; i++) {
      sessionManager.createSession(`user-${i}`);
    }

    // A sexta deve retornar um erro ou falso
    const result = sessionManager.createSession('user-6');
    expect(result).toBe(false);
  });

  test('Deve armazenar a string do QR Code quando gerado', () => {
    sessionManager.createSession('user-1');
    sessionManager.updateSession('user-1', { qrcode: 'data:image/png;base64,123' });

    const session = sessionManager.getSession('user-1');
    expect(session.qrcode).toContain('base64');
  });
});