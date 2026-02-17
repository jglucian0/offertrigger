const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: { rejectUnauthorized: false },

  max: 3,
  idleTimeoutMillis: 10000,
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