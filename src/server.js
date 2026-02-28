const app = require('./app')
require('./workers/dispatcher');

const PORT = process.env.PORT || 3001;

process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM. Encerrando com segurança...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`⚙️ Back-end rodando em ${PORT}`);
})


