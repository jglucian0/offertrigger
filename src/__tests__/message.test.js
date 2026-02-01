const request = require('supertest');
const app = require('../app.js');

jest.mock('../services/wppService', () => {
  return jest.fn().mockImplementation(() => {
    return {
      // Simulamos o método de envio para não dar erro de "not a function"
      sendText: jest.fn().mockResolvedValue({ ack: 1 }),
      initSession: jest.fn().mockResolvedValue(true)
    };
  });
});

describe('Issue #04 - Validação de Envio de Mensagens', () => {

  test('🔴 Deve retornar 404 se o userId não existir no SessionManager', async () => {
    const res = await request(app)
      .post('/message/send')
      .send({
        userId: 'usuario-inexistente',
        to: '5511999999999',
        message: 'Teste'
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Sessão não encontrada');
  });

  test('🔴 Deve retornar 400 se o usuário existe mas não está conectado', async () => {
    // 1. Criamos a sessão (ela inicia com status 'starting', não 'inChat')
    await request(app).post('/session/start').send({ userId: 'user-offline' });

    // 2. Tentamos enviar mensagem
    const res = await request(app)
      .post('/message/send')
      .send({
        userId: 'user-offline',
        to: '5511999999999',
        message: 'Teste'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('WhatsApp não está conectado');
  });
});