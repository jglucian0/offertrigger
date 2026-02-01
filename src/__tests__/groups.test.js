const request = require('supertest');
const app = require('../app.js');

describe('Issue #04.1 - Listagem de Grupos', () => {
  test('Deve retornar erro 400 se o usuário não estiver conectado', async () => {
    const res = await request(app).get('/session/groups/user-desconectado');
    expect(res.statusCode).toBe(400);
  });
});