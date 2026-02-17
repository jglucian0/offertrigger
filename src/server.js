const app = require('./app')
require('./workers/dispatcher');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`⚙️ Back-end rodando em ${PORT}`);
})


