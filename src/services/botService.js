const fs = require('fs');
const path = require('path');

class BotService {
  constructor(affiliateService) {
    this.affiliateService = affiliateService;
    this.nichosValidos = ['academia', 'eletronicos', 'moda'];

    this.uploadPath = path.resolve(__dirname, '../../uploads');

    // Cria a pasta caso não exista
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  normalizeText(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .toLowerCase()
      .trim();
  }

  identificarNicho(termo) {
    const termoNormalizado = this.normalizeText(termo);

    return this.nichosValidos.find(nicho =>
      nicho.substring(0, 4) === termoNormalizado.substring(0, 4)
    );
  }

  async processIncomingMessage(client, message) {
    if (message.fromMe) return;

    const body = message.caption || message.body || '';
    const lines = body.split('\n').map(l => l.trim()).filter(l => l !== '');

    if (lines.length >= 2) {
      const nichosRaw = lines[0].split(',');
      const nichosIdentificados = nichosRaw
        .map(n => this.identificarNicho(n))
        .filter(n => n !== undefined);

      const urlDetectada = lines.find(l =>
        l.startsWith('https://produto.mercadolivre.com.br/') ||
        l.startsWith('https://www.mercadolivre.com.br/') ||
        l.startsWith('https://mercadolivre.com/sec/')
      );

      if (urlDetectada && nichosIdentificados.length > 0) {
        try {
          let linkAfiliado = '';
          if (urlDetectada.startsWith('https://mercadolivre.com/sec/')) {
            console.log('[Bot] Link "sec" detectado. Repassando sem converter.');
            linkAfiliado = urlDetectada;
          } else {
            try {
              console.log('[Bot] Convertendo link no Affiliate Builder...');
              linkAfiliado = await this.affiliateService.generateAffiliateLink(urlDetectada);

              if (!linkAfiliado) throw new Error('Retorno vazio');
            } catch (err) {
              console.error('[Bot] Falha na conversão:', err.message);
              linkAfiliado = 'Falha ao gerar o link de affiliado';
            }
          }

          let fotoCaminhoLocal = null;
          if (message.isMedia || message.type === 'image') {
            console.log('[Bot] Baixando imagem enviada...');
            const buffer = await client.decryptFile(message);

            const fileName = `${Date.now()}.jpg`;
            fotoCaminhoLocal = path.join(this.uploadPath, fileName);

            fs.writeFileSync(fotoCaminhoLocal, buffer);
            console.log(`[Bot] Foto salva em: ${fotoCaminhoLocal}`);
          }

          console.log(`[Bot] Nicho detectado: ${nichosIdentificados.join(', ')}`);
          console.log(`[Bot] URL detectada: ${urlDetectada}`);
          console.log(`[Bot] URL affiliado: ${linkAfiliado}`);
          console.log(`Foto Local: ${fotoCaminhoLocal || 'Sem foto'}`);
          console.log(`[Bot] Enviado por: ${message.from}`);
        } catch (err) {
          console.error('[Bot] Erro no processamento:', err.message);
        }
        // No futuro, aqui chamaremos o Scraper e o Prisma
        // Por enquanto, apenas o log como solicitado.

        // Exemplo de resposta simples para teste
        // await client.sendText(message.from, `Processando item para o nicho: ${nichoIdentificado}...`);
      }
    }
  }
}

module.exports = BotService;