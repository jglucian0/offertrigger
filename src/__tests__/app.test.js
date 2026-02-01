const request = require('supertest')
const app = require('../app.js')
const { describe } = require('node:test')

describe('API Status', () => {
  test('Deve responder na roda raiz', async () => {
    const res = await request(app).get('/')
    expect(res.statusCode).toEqual(200)
    expect(res.body.message).toBe('Servidor online')
  })
})