require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const ScraperService = require('./scraperService')
const MessageFormatter = require('./messageFormatter');
const ImageService = require('./imageService');
const nicheGroups = require('../config/nicheGroups');
const DispatchQueueRepository = require('../repositories/dispatchQueueRepository')

class BotService {
  constructor(affiliateService) {
    this.affiliateService = affiliateService;
    this.scraperService = new ScraperService();
    this.nichosValidos = ['academia', 'eletronicos', 'moda'];
    this.pendingApprovals = new Map();
    this.pendingBroadcast = new Map();

    this.uploadPath = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  identificarNicho(termo) {
    const t = this.normalizeText(termo);
    return this.nichosValidos.find(n => n.substring(0, 4) === t.substring(0, 4));
  }

  async downloadImageToTemp(url) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.uploadPath, `scraped_${Date.now()}.jpg`);

      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'image/*'
        }
      }, res => {

        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
          return resolve(this.downloadImageToTemp(res.headers.location));

        if (res.statusCode !== 200)
          return reject(new Error(`HTTP ${res.statusCode}`));

        const stream = fs.createWriteStream(filePath);
        res.pipe(stream);
        stream.on('finish', () => resolve(filePath));
      }).on('error', reject);
    });
  }

  buildMessage(produto, link, config = {}) {
    return MessageFormatter.format({
      ...produto,
      link,
      ...config
    });
  }

  async resolveImage(state) {
    if (state.imagePath) return state.imagePath;
    return this.downloadImageToTemp(state.produto.imageUrl);
  }

  async sendPreview(client, chatId, state) {
    const mensagem = this.buildMessage(state.produto, 'link de afiliado', state.config);

    await client.sendText(chatId, `🛠️ Preview editável:\n\n${mensagem}

[1] - \`✅ Enviar\`
[2] - \`✏️ Editar título\`
[3] - \`💰 Editar preço\`
[4] - \`💸 Remover preço antigo\`
[5] - \`☠️ Remover emoji\`
[6] - \`📝 Adicionar informação\`
[7] - \`⚡ Disparo instantâneo\`
[8] - \`📌 Inserir antetítulo\`
[0] - \`❌ Cancelar\``);
  }


  async handleApprovalResponse(client, message) {
    const state = this.pendingApprovals.get(message.from);
    if (!state) return;

    const text = (message.body || '').trim();

    if (state.etapa === 'menu') {

      if (text === '1' || text === '7') {

        const mensagem = this.buildMessage(state.produto, state.link, state.config);
        const tempImage = await this.resolveImage(state);
        const finalImage = await ImageService.applyWatermark(tempImage);

        if (text === '7') {

          for (const niche of state.niches) {
            const groupId = nicheGroups[niche];
            if (groupId)
              await client.sendImage(groupId, finalImage, 'produto.jpg', mensagem);
          }

          fs.unlink(finalImage, () => { });
          fs.unlink(tempImage, () => { });
          this.pendingApprovals.delete(message.from);

          return client.sendText(message.from, '⚡ Disparo instantâneo concluído.');
        }

        const offersPath = path.resolve(__dirname, '../../storage/offers');
        if (!fs.existsSync(offersPath)) fs.mkdirSync(offersPath, { recursive: true });

        const finalPath = path.join(offersPath, `offer_${Date.now()}.jpg`);
        fs.renameSync(finalImage, finalPath);
        fs.unlink(tempImage, () => { });

        for (const niche of state.niches) {
          await DispatchQueueRepository.enqueue({
            title: state.produto.title,
            message: mensagem,
            imagePath: finalPath,
            affiliateUrl: state.link,
            niche,
            original_price: state.original_price,
            current_price: state.current_price,
            discount: state.discount,
            free_shipping: state.free_shipping
          });
        }

        this.pendingApprovals.delete(message.from);
        return client.sendText(message.from, `📦 Produto salvo na fila: ${state.niches.join(', ')}`);
      }

      if (text === '2') return state.etapa = 'edit_title', client.sendText(message.from, '✏️ Novo título:');
      if (text === '3') return state.etapa = 'edit_price', client.sendText(message.from, '💰 Novo preço:');
      if (text === '4') return state.config.removerPrecoAntigo = true, this.sendPreview(client, message.from, state);
      if (text === '5') return state.config.semEmoji = true, this.sendPreview(client, message.from, state);
      if (text === '6') return state.etapa = 'edit_extra', client.sendText(message.from, '📝 Informação extra:');
      if (text === '8') return state.etapa = 'edit_ante', client.sendText(message.from, '📌 Antetítulo:');
      if (text === '0') return this.pendingApprovals.delete(message.from), client.sendText(message.from, '❌ Cancelado.');

      return client.sendText(message.from, 'Opção inválida.');
    }

    if (state.etapa === 'edit_title') state.config.tituloCustom = text;
    if (state.etapa === 'edit_price') state.config.precoCustom = text;
    if (state.etapa === 'edit_extra') state.config.extraInfo = text;
    if (state.etapa === 'edit_ante') state.config.anteTitulo = text;

    state.etapa = 'menu';
    return this.sendPreview(client, message.from, state);
  }

  async processIncomingMessage(client, message) {
    if (message.fromMe) return;

    if (this.pendingApprovals.has(message.from)) return this.handleApprovalResponse(client, message);

    if (this.pendingBroadcast.has(message.from)) {

      const bodyRaw = (message.body || '').trim();
      const state = this.pendingBroadcast.get(message.from);

      if (state.etapa === 'aguardando_mensagem') {

        if (message.isMedia || message.type === 'image') {

          const buffer = await client.decryptFile(message);

          const fileName = `aviso_${Date.now()}.jpg`;
          const filePath = path.join(this.uploadPath, fileName);

          fs.writeFileSync(filePath, buffer);

          state.imagePath = filePath;
          state.texto = message.caption || '';

        } else {
          state.texto = bodyRaw;
        }

        state.etapa = 'menu';

        await client.sendText(message.from,
          `🛠️ Preview do aviso:

${state.texto || '[imagem]'}

Escolha o nicho:

[1] - Academia
[2] - Moda
[3] - Eletrônicos
[0] - Cancelar`);

        return;
      }

      if (state.etapa === 'menu') {

        if (bodyRaw === '0') {
          this.pendingBroadcast.delete(message.from);
          await client.sendText(message.from, '❌ Cancelado.');
          return;
        }

        if (bodyRaw === '1') state.niche = 'academia';
        if (bodyRaw === '2') state.niche = 'moda';
        if (bodyRaw === '3') state.niche = 'eletronicos';

        if (!state.niche) {
          await client.sendText(message.from, 'Opção inválida.');
          return;
        }

        const groupId = nicheGroups[state.niche];

        if (!groupId) {
          await client.sendText(message.from, 'Grupo não configurado.');
          this.pendingBroadcast.delete(message.from);
          return;
        }

        console.log(`[Bot] Aviso enviado para ${state.niche}`);

        if (state.imagePath) {

          await client.sendImage(
            groupId,
            state.imagePath,
            'aviso.jpg',
            state.texto || ''
          );

          fs.unlink(state.imagePath, () => { });

        } else {
          await client.sendText(groupId, state.texto);
        }

        await client.sendText(message.from, '✅ Aviso enviado.');

        this.pendingBroadcast.delete(message.from);
        return;
      }
    }

    const body = message.caption || message.body || '';
    const lines = body.split('\n').map(l => l.trim()).filter(l => l !== '');

    if (body.trim() === '/aviso') {

      this.pendingBroadcast.set(message.from, {
        etapa: 'aguardando_mensagem',
        texto: null,
        niche: null,
        imagePath: null
      });

      await client.sendText(message.from, '📢 Envie o texto do aviso:');
      return;
    }

    let nichosIdentificados = [];

    if (lines.length >= 2) {
      const nichosRaw = lines[0].split(',');
      nichosIdentificados = nichosRaw
        .map(n => this.identificarNicho(n))
        .filter(n => n !== undefined);

      const urlDetectada = lines.find(l =>
        l.startsWith('https://produto.mercadolivre.com.br/') ||
        l.startsWith('https://www.mercadolivre.com.br/') ||
        l.startsWith('https://mercadolivre.com/sec/')
      );


      if (urlDetectada && nichosIdentificados.length > 0) {
        try {

          const dadosScraper = await this.scraperService.fetchProducts(urlDetectada);
          const produtoUrlReal = dadosScraper.url || urlDetectada;
          let linkAfiliado;

          try {
            console.log('[Bot] Convertendo link real do produto...');
            linkAfiliado = await this.affiliateService.generateAffiliateLink(produtoUrlReal);
          } catch (err) {
            console.error('[Bot] Falha ao converter link:', err.message);
            linkAfiliado = produtoUrlReal;
          }

          let fotoCaminhoLocal = null;

          if (message.isMedia || message.type === 'image') {
            const buffer = await client.decryptFile(message);
            const fileName = `${Date.now()}.jpg`;
            fotoCaminhoLocal = path.join(this.uploadPath, fileName);
            fs.writeFileSync(fotoCaminhoLocal, buffer);
          }

          const mensagem = MessageFormatter.format({
            ...dadosScraper,
            link: linkAfiliado
          });

          let imagemParaEnviar;

          if (fotoCaminhoLocal) {
            imagemParaEnviar = fotoCaminhoLocal;
          } else if (dadosScraper.imageUrl) {
            imagemParaEnviar = await this.downloadImageToTemp(dadosScraper.imageUrl);
          } else {
            throw new Error('Nenhuma imagem disponível para envio');
          }

          const imagemComMarca = await ImageService.applyWatermark(imagemParaEnviar);

          this.pendingApprovals.set(message.from, {
            etapa: 'menu',
            produto: dadosScraper,
            link: linkAfiliado,
            linkOriginal: produtoUrlReal,
            niches: nichosIdentificados,

            imagePath: imagemParaEnviar,

            original_price: dadosScraper.oldPriceValue || null,
            current_price: dadosScraper.currentPriceValue || null,
            discount: dadosScraper.discountPercent || 0,
            free_shipping:
              typeof dadosScraper.shipping === 'string' &&
              /gratis|grátis/i.test(dadosScraper.shipping),

            config: {
              anteTitulo: null,
              tituloCustom: null,
              precoCustom: null,
              removerPrecoAntigo: false,
              semEmoji: false,
              extraInfo: null
            }
          });

          await client.sendImage(
            message.from,
            imagemComMarca,
            'produto.jpg',
            mensagem,
          );

          fs.unlink(imagemComMarca, () => { });

          await client.sendText(message.from,
            `O que deseja fazer?

[1] - \`✅ Enviar\`
[2] - \`✏️ Editar título\`
[3] - \`💰 Editar preço\`
[4] - \`💸 Remover preço antigo\`
[5] - \`☠️ Remover emoji\`
[6] - \`📝 Adicionar informação\`
[7] - \`⚡ Disparo instantâneo\`
[8] - \`📌 Inserir antetítulo\`
[0] - \`❌ Cancelar\``);

        } catch (err) {
          console.error('[Bot] Erro no processamento:', err.message);
        }
      }
    }
  }
}

module.exports = BotService;