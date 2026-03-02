require('dotenv').config();
const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const ScraperService = require('./scraperService')
const MessageFormatter = require('./messageFormatter');
const ImageService = require('./imageService');
const DispatchQueueRepository = require('../repositories/dispatchQueueRepository')
const nicheGroupService = require('../services/nicheGroupService')
const urlResolverService = require('../services/urlResolverService');


class BotService {
  getSessionMap(map, sessionId) {
    if (!map.has(sessionId)) {
      map.set(sessionId, new Map());
    }
    return map.get(sessionId);
  }

  constructor(affiliateService) {
    this.affiliateService = affiliateService;
    this.scraperService = new ScraperService();
    this.pendingApprovals = new Map();
    this.pendingBroadcast = new Map();

    this.uploadPath = path.resolve(__dirname, '../../uploads/offers');

    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  normalizePriceInput(value) {
    if (!value) return null;

    let v = value.trim();

    // remove R$, espaços e tudo que não seja número, vírgula ou ponto
    v = v.replace(/[^\d.,]/g, '');

    // Se tiver vírgula e ponto
    if (v.includes(',') && v.includes('.')) {
      // Assume que o último separador é o decimal
      if (v.lastIndexOf(',') > v.lastIndexOf('.')) {
        // Formato BR: 1.299,90
        v = v.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato US: 1,299.90
        v = v.replace(/,/g, '');
      }
    }
    // Só vírgula
    else if (v.includes(',')) {
      v = v.replace(',', '.');
    }
    // Só ponto → já está ok

    const parsed = parseFloat(v);

    return isNaN(parsed) ? null : parsed;
  }

  async identificarNicho(sessionId, termo) {

    if (!termo) return undefined;

    const t = this.normalizeText(termo);

    const groupsData = await nicheGroupService.listBySession(sessionId);

    const nichosUnicos = [
      ...new Set(
        groupsData
          .filter(g => g.active)
          .map(g => g.niche)
      )
    ];

    return nichosUnicos.find(n =>
      this.normalizeText(n).substring(0, 4) === t.substring(0, 4)
    );
  }

  async downloadImageToTemp(url) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(os.tmpdir(), `scraped_${Date.now()}.jpg`);

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
[9] - \`🎟️ Gerenciar cupom\`
[0] - \`❌ Cancelar\``);
  }

  async handleApprovalResponse(client, message, sessionId) {
    const sessionMap = this.getSessionMap(this.pendingApprovals, sessionId);
    const state = sessionMap.get(message.from);

    if (!state) return;

    const text = (message.body || '').trim();

    if (state.etapa === 'menu') {

      if (text === '1' || text === '7') {

        const mensagem = this.buildMessage(state.produto, state.link, state.config);
        const tempImage = await this.resolveImage(state);
        const finalImage = await ImageService.applyWatermark(tempImage);

        if (text === '7') {

          for (const niche of state.niches) {
            const groups = await nicheGroupService.getGroups(niche)
            for (const groupId of groups) {
              await client.sendImage(groupId, finalImage, 'produto.jpg', mensagem);
            }
          }

          fs.unlink(finalImage, () => { });
          fs.unlink(tempImage, () => { });
          sessionMap.delete(message.from);

          return client.sendText(message.from, '⚡ Disparo instantâneo concluído.');
        }

        const fileName = `offer_${Date.now()}.jpg`
        const finalPath = path.join(this.uploadPath, fileName)

        fs.copyFileSync(finalImage, finalPath)
        fs.unlinkSync(finalImage)

        if (state.config.precoCustom) {
          state.current_price = parseFloat(state.config.precoCustom);
        }

        for (const niche of state.niches) {
          await DispatchQueueRepository.enqueue({
            sessionId: client.session,
            title: state.config.tituloCustom || state.produto.title,
            message: mensagem,
            imagePath: fileName,
            affiliateUrl: state.link,
            niche,
            original_price: state.original_price,
            current_price: state.current_price,
            discount: state.discount,
            free_shipping: state.free_shipping
          });
        }

        sessionMap.delete(message.from);
        return client.sendText(message.from, `📦 Produto salvo na fila: ${state.niches.join(', ')}`);
      }

      if (text === '2') return state.etapa = 'edit_title', client.sendText(message.from, '✏️ Novo título:');
      if (text === '3') return state.etapa = 'edit_price', client.sendText(message.from, '💰 Novo preço:');
      if (text === '4') return state.config.removerPrecoAntigo = true, this.sendPreview(client, message.from, state);
      if (text === '5') return state.config.semEmoji = true, this.sendPreview(client, message.from, state);
      if (text === '6') return state.etapa = 'edit_extra', client.sendText(message.from, '📝 Informação extra:');
      if (text === '8') return state.etapa = 'edit_ante', client.sendText(message.from, '📌 Antetítulo:');
      if (text === '9') {
        state.etapa = 'coupon_menu';
        return client.sendText(message.from,
          `🎟️ Gerenciar cupom:

[1] - Apagar cupom
[2] - Editar cupom
[0] - Voltar`);
      }
      if (text === '0') return sessionMap.delete(message.from), client.sendText(message.from, '❌ Cancelado.');

      return client.sendText(message.from, 'Opção inválida.');
    }

    if (state.etapa === 'coupon_menu') {

      if (text === '1') {
        state.config.couponOverride = null;
        state.config.removeCoupon = true;
        state.etapa = 'menu';
        return this.sendPreview(client, message.from, state);
      }

      if (text === '2') {
        state.etapa = 'edit_coupon';
        return client.sendText(message.from, '✏️ Envie o texto do cupom (ex: +R$20 OFF ou +15% OFF)');
      }

      if (text === '0') {
        state.etapa = 'menu';
        return this.sendPreview(client, message.from, state);
      }

      return client.sendText(message.from, 'Opção inválida.');
    }

    if (state.etapa === 'edit_title') state.config.tituloCustom = text;
    if (state.etapa === 'edit_price') {
      const normalized = this.normalizePriceInput(text);

      if (!normalized) {
        return client.sendText(message.from, '❌ Valor inválido.');
      }

      state.config.precoCustom = normalized;
    }
    if (state.etapa === 'edit_extra') state.config.extraInfo = text;
    if (state.etapa === 'edit_ante') state.config.anteTitulo = text;
    if (state.etapa === 'edit_coupon') {
      state.config.couponOverride = text;
      state.config.removeCoupon = false;
      state.etapa = 'menu';
      return this.sendPreview(client, message.from, state);
    }

    state.etapa = 'menu';
    return this.sendPreview(client, message.from, state);
  }




  async processIncomingMessage(client, message, sessionId) {
    try {
      if (message.fromMe) return;
      if (message.isGroupMsg || message.from.includes('@g.us')) return;

      const approvalMap = this.getSessionMap(this.pendingApprovals, sessionId);
      const broadcastMap = this.getSessionMap(this.pendingBroadcast, sessionId);

      if (approvalMap.has(message.from)) {

        const state = approvalMap.get(message.from);

        if (state?.etapa === 'escolher_nicho') {

          const index = parseInt(message.body) - 1;

          if (isNaN(index) || !state.nichosDisponiveis[index])
            return client.sendText(message.from, 'Opção inválida.');

          const nichoEscolhido = state.nichosDisponiveis[index];

          approvalMap.delete(message.from);

          return this.processIncomingMessage(
            client,
            {
              ...message,
              body: `${nichoEscolhido}\n${state.link}`,
              isMedia: !!state.imagePath,
              type: state.imagePath ? 'image' : message.type,
              __imagePathFromStep: state.imagePath
            },
            sessionId
          );
        }


        return this.handleApprovalResponse(client, message, sessionId);
      }

      if (broadcastMap.has(message.from)) {

        const bodyRaw = (message.body || '').trim();
        const state = broadcastMap.get(message.from);

        if (state?.etapa === 'aguardando_mensagem') {

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

          const groupsFromDb = await nicheGroupService.listBySession(sessionId);

          console.log('GROUPS DO BANCO:', groupsFromDb);

          const groups = groupsFromDb.filter(g => g.active);


          const nichosUnicos = [...new Set(groups.map(g => g.niche))];

          if (!nichosUnicos.length) {
            broadcastMap.delete(message.from);
            await client.sendText(message.from, 'Nenhum nicho configurado.');
            return;
          }

          state.nichosDisponiveis = nichosUnicos;
          state.etapa = 'menu';

          let menu = `🛠️ Preview do aviso:

        ${state.texto || '[imagem]'}

        Escolha o nicho:`;

          nichosUnicos.forEach((n, i) => {
            menu += `[${i + 1}] - ${n}\n`;
          });

          menu += `[0] - Cancelar`;

          await client.sendText(message.from, menu);
          return;
        }

        if (state.etapa === 'menu') {

          if (bodyRaw === '0') {
            broadcastMap.delete(message.from);
            await client.sendText(message.from, '❌ Cancelado.');
            return;
          }

          const index = parseInt(bodyRaw) - 1;

          if (isNaN(index) || !state.nichosDisponiveis[index]) {
            await client.sendText(message.from, 'Opção inválida.');
            return;
          }

          state.niche = state.nichosDisponiveis[index];

          if (!state.niche) {
            await client.sendText(message.from, 'Opção inválida.');
            return;
          }

          const groups = await nicheGroupService.getGroupsBySession(sessionId, state.niche);

          if (!groups.length) {
            await client.sendText(message.from, 'Grupo não configurado.');
            broadcastMap.delete(message.from);
            return;
          }

          console.log(`[Bot] Aviso enviado para ${state.niche}`);

          if (state.imagePath) {
            for (const groupId of groups) {
              await client.sendImage(
                groupId,
                state.imagePath,
                'aviso.jpg',
                state.texto || ''
              );
            }

            fs.unlink(state.imagePath, () => { });

          } else {
            for (const groupId of groups) {
              await client.sendText(groupId, state.texto);
            }
          }

          await client.sendText(message.from, '✅ Aviso enviado.');

          broadcastMap.delete(message.from);
          return;
        }
      }

      const body = message.caption || message.body || '';
      const lines = body.split('\n').map(l => l.trim()).filter(l => l !== '');

      if (body.trim() === '/aviso') {

        broadcastMap.set(message.from, {
          etapa: 'aguardando_mensagem',
          texto: null,
          niche: null,
          imagePath: null
        });

        await client.sendText(message.from, '📢 Envie o texto do aviso:');
        return;
      }

      const bodyTrim = (message.caption || message.body || '').trim();
      const urlDetectada = bodyTrim.match(/https?:\/\/\S+/)?.[0];

      if (urlDetectada && lines.length === 1) {

        let fotoCaminhoLocal = null;

        if (message.isMedia || message.type === 'image') {
          const buffer = await client.decryptFile(message);
          const fileName = `${Date.now()}.jpg`;
          fotoCaminhoLocal = path.join(this.uploadPath, fileName);
          fs.writeFileSync(fotoCaminhoLocal, buffer);
        }

        const groups = (await nicheGroupService.listBySession(sessionId))
          .filter(g => g.active);

        const nichosUnicos = [...new Set(groups.map(g => g.niche))];

        if (!nichosUnicos.length)
          return client.sendText(message.from, 'Nenhum nicho configurado.');

        const sessionMap = this.getSessionMap(this.pendingApprovals, sessionId);

        sessionMap.set(message.from, {
          etapa: 'escolher_nicho',
          link: urlDetectada,
          nichosDisponiveis: nichosUnicos,
          imagePath: fotoCaminhoLocal
        });

        let menu = 'Escolha o nicho:\n\n';

        nichosUnicos.forEach((n, i) => {
          menu += `[${i + 1}] - ${n}\n`;
        });

        return client.sendText(message.from, menu);
      }

      let nichosIdentificados = [];

      if (lines.length >= 2) {
        const nichosRaw = lines[0].split(',');
        nichosIdentificados = await Promise.all(
          nichosRaw.map(n => this.identificarNicho(sessionId, n))
        );

        nichosIdentificados = nichosIdentificados.filter(n => n);

        const urlDetectada = lines.find(l =>
          l.startsWith('https://produto.mercadolivre.com.br/') ||
          l.startsWith('https://www.mercadolivre.com.br/') ||
          l.startsWith('https://meli.la/') ||
          l.startsWith('https://mercadolivre.com/sec/')
        );


        if (urlDetectada && nichosIdentificados.length > 0) {
          await client.sendText(message.from, '⏳ Aguarde um momento, estou processando o produto...');

          try {
            let urlFinal = urlDetectada;

            if (
              urlDetectada.includes('meli.la') ||
              urlDetectada.includes('/social/') ||
              urlDetectada.includes('/sec/')
            ) {
              console.log('[Bot] Resolvendo URL encurtada...');
              urlFinal = await urlResolverService.resolveFinalUrl(urlDetectada);
              console.log('[Bot] URL final:', urlFinal);
            }

            const dadosScraper = await this.scraperService.fetchProducts(urlFinal);
            const produtoUrlReal = dadosScraper.url || urlDetectada;
            let linkAfiliado;

            try {
              linkAfiliado = await this.affiliateService.generateAffiliateLink(produtoUrlReal, sessionId);
            } catch (err) {
              console.error('[Bot] Falha ao converter link:', err.message);
              linkAfiliado = produtoUrlReal;
            }

            let fotoCaminhoLocal = null;

            if (message.__imagePathFromStep) {
              fotoCaminhoLocal = message.__imagePathFromStep;
            } else if (message.isMedia || message.type === 'image') {
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

            approvalMap.set(message.from, {
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
                extraInfo: null,
                couponOverride: null,
                removeCoupon: false
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
[9] - \`🎟️ Gerenciar cupom\`
[0] - \`❌ Cancelar\``);

          } catch (err) {
            console.error('[Bot] Erro no processamento:', err);

            approvalMap.delete(message.from);

            await client.sendText(
              message.from,
              '❌ Ocorreu um erro ao processar o produto.\nTente novamente ou envie outro link.'
            );
          }
        }
      }
    } catch (error) {
      console.error('[Bot] Erro inesperado:', error);

      try {
        await client.sendText(
          message.from,
          '❌ Ocorreu um erro inesperado. O bot já está pronto para receber outro produto.'
        );
      } catch (_) { }
    }
  }
}

module.exports = BotService;