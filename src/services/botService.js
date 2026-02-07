const fs = require('fs');
const path = require('path');
const https = require('https');
const ScraperService = require('./scraperService')
const MessageFormatter = require('./messageFormatter');

class BotService {
  constructor(affiliateService) {
    this.affiliateService = affiliateService;
    this.scraperService = new ScraperService();
    this.nichosValidos = ['academia', 'eletronicos', 'moda'];
    this.pendingApprovals = new Map();

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

  async downloadImageToTemp(url) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `scraped_${Date.now()}.jpg`;
        const filePath = path.join(this.uploadPath, fileName);

        const options = {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
          }
        };

        https.get(url, options, (res) => {

          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(this.downloadImageToTemp(res.headers.location));
          }

          if (res.statusCode !== 200) {
            return reject(new Error(`Falha ao baixar imagem: ${res.statusCode}`));
          }

          const fileStream = fs.createWriteStream(filePath);
          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            resolve(filePath);
          });

        }).on('error', reject);

      } catch (err) {
        reject(err);
      }
    });
  }

  async sendPreview(client, chatId, state) {

    const mensagem = MessageFormatter.format({
      ...state.produto,
      link: 'link de afiliado', // mascara o link
      ...state.config
    });

    await client.sendText(chatId,
      `🛠️ Preview editável:

${mensagem}
    
[1] - \`✅ Enviar\`
[2] - \`✏️ Editar título\`
[3] - \`💰 Editar preço\`
[4] - \`💸 Remover preço antigo\`
[5] - \`☠️ Remover emoji\`
[0] - \`❌ Cancelar\``);
  }

  async handleApprovalResponse(client, message) {
    const state = this.pendingApprovals.get(message.from);
    if (!state) return;

    const text = (message.body || '').trim();

    if (state.etapa === 'menu') {
      if (text === '1') {
        const mensagem = MessageFormatter.format({
          ...state.produto,
          link: state.link,
          ...state.config
        });

        await client.sendText(message.from, '✅ Oferta aprovada! (aqui futuramente enviará aos grupos)');
        console.log('[Bot] Oferta final:\n', mensagem);

        this.pendingApprovals.delete(message.from);
        return;
      }

      if (text === '2') {
        state.etapa = 'edit_title';
        await client.sendText(message.from, '✏️ Digite o novo título:');
        return;
      }

      if (text === '3') {
        state.etapa = 'edit_price';
        await client.sendText(message.from, '💰 Digite o novo preço (ex: 89,90)');
        return;
      }

      if (text === '4') {
        state.config.removerPrecoAntigo = true;
        return this.sendPreview(client, message.from, state);
      }

      if (text === '5') {
        state.config.semEmoji = true;
        return this.sendPreview(client, message.from, state);
      }

      if (text === '0') {
        this.pendingApprovals.delete(message.from);
        await client.sendText(message.from, '❌ Cancelado.');
        return;
      }

      await client.sendText(message.from, 'Envie uma opção válida.');
      return;
    }

    if (state.etapa === 'edit_title') {
      state.config.tituloCustom = text;
      state.etapa = 'menu';
      return this.sendPreview(client, message.from, state);
    }

    if (state.etapa === 'edit_price') {
      state.config.precoCustom = text;
      state.etapa = 'menu';
      return this.sendPreview(client, message.from, state);
    }
  }

  async processIncomingMessage(client, message) {
    if (message.fromMe) return;

    if (this.pendingApprovals.has(message.from)) {
      return this.handleApprovalResponse(client, message);
    }

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

          const dadosScraper = await this.scraperService.fetchProducts(urlDetectada, false);

          const precoAtualFormatado = dadosScraper.currentPriceValue
            ? `R$ ${dadosScraper.currentPriceReais},${dadosScraper.currentPriceCents}`
            : 'Preço atual não encontrado';

          const precoAntigoFormatado = dadosScraper.oldPriceValue
            ? `R$ ${dadosScraper.oldPriceReais},${dadosScraper.oldPriceCents}`
            : 'Sem preço antigo';

          console.log(`[Bot] Nicho detectado: ${nichosIdentificados.join(', ')}`);
          console.log(`[Bot] URL detectada: ${urlDetectada}`);
          console.log(`[Bot] URL affiliado: ${linkAfiliado}`);
          console.log(`[Bot] Título: ${dadosScraper.title}`);
          console.log(`[Bot] Preço Atual: ${precoAtualFormatado}`);
          console.log(`[Bot] Valor Atual Numérico: ${dadosScraper.currentPriceValue}`);


          console.log(`[Bot] Preço Antigo: ${precoAntigoFormatado}`);
          console.log(`[Bot] Valor Antigo Numérico: ${dadosScraper.oldPriceValue}`);
          console.log(`[Bot] Desconto Calculado: ${dadosScraper.discountPercent}%`);

          console.log(`[Bot] Frete: ${dadosScraper.shipping}`);
          console.log(`[Bot] Quantidade de vendas: ${dadosScraper.soldQuantity}`);

          console.log(`[Bot] Foto Scraping: ${dadosScraper.imageUrl}`);
          console.log(`[Bot] Foto Local: ${fotoCaminhoLocal || 'Sem foto'}`);
          console.log(`[Bot] Enviado por: ${message.from}`);


          const mensagem = MessageFormatter.format({
            ...dadosScraper,
            link: linkAfiliado
          });

          let imagemParaEnviar = null;
          let imagemTemporaria = false;

          if (fotoCaminhoLocal) {
            imagemParaEnviar = fotoCaminhoLocal;
          } else if (dadosScraper.imageUrl) {
            console.log('[Bot] Baixando imagem do scraping...');
            imagemParaEnviar = await this.downloadImageToTemp(dadosScraper.imageUrl);
            imagemTemporaria = true;
          } else {
            throw new Error('Nenhuma imagem disponível para envio');
          }

          await client.sendImage(
            message.from,
            imagemParaEnviar,
            'produto.jpg',
            mensagem,
          );

          this.pendingApprovals.set(message.from, {
            etapa: 'menu',
            produto: dadosScraper,
            link: linkAfiliado,
            config: {
              tituloCustom: null,
              precoCustom: null,
              removerPrecoAntigo: false,
              semEmoji: false
            }
          });

          await client.sendText(message.from,
            `O que deseja fazer?

[1] - \`✅ Enviar\`
[2] - \`✏️ Editar título\`
[3] - \`💰 Editar preço\`
[4] - \`💸 Remover preço antigo\`
[5] - \`☠️ Remover emoji\`
[0] - \`❌ Cancelar\``);

          if (fotoCaminhoLocal) {
            fs.unlink(fotoCaminhoLocal, () => { });
          }

          if (imagemTemporaria && imagemParaEnviar) {
            fs.unlink(imagemParaEnviar, () => { });
          }
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