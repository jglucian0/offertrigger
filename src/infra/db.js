const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
})

pool.on('error', err => {
  console.error('[ERROR] Erro inesperado no pool:', err)
  console.log(
    'Tentando conectar com a URL:',
    process.env.DATABASE_URL ? 'URL encontrada' : 'ERRO: URL VAZIA'
  )
})

module.exports = pool