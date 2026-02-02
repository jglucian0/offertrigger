const axios = require('axios');

async function enviarOfertaPelaAPI() {
  const urlApi = 'http://localhost:3001/message/send'; // Sua rota existente

  const payload = {
    userId: "jglucaino",
    to: "120363423722087569@g.us",
    url: "https://mercadolivre.com/sec/1Q1NTGY" // A URL que o controller vai processar
  };

  try {
    console.log('📡 Enviando comando para o servidor...');
    const response = await axios.post(urlApi, payload);
    console.log('✅ Resposta do Servidor:', response.data);
  } catch (error) {
    console.error('❌ Erro ao chamar API:', error.response?.data || error.message);
  }
}

enviarOfertaPelaAPI();