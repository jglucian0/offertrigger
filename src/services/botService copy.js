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
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  async identificarNicho(sessionId, termo) {
    const t = this.normalizeText(termo);

    const groupsData = await nicheGroupService.listBySession(sessionId);

    const groups = groupsData
      .filter(g => g.niche === state.niche && g.active)
      .map(g => g.group_id);

    const nichosUnicos = [...new Set(groups.map(g => g.niche))];

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

        for (const niche of state.niches) {
          await DispatchQueueRepository.enqueue({
            sessionId: sessionId,
            title: state.produto.title,
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
      if (text === '0') {
        sessionMap.delete(message.from);
        return client.sendText(message.from, '❌ Cancelado.');
      }

      return client.sendText(message.from, 'Opção inválida.');
    }

    if (state.etapa === 'edit_title') state.config.tituloCustom = text;
    if (state.etapa === 'edit_price') state.config.precoCustom = text;
    if (state.etapa === 'edit_extra') state.config.extraInfo = text;
    if (state.etapa === 'edit_ante') state.config.anteTitulo = text;

    state.etapa = 'menu';
    return this.sendPreview(client, message.from, state);
  }

  async processIncomingMessage(client, message, sessionId) {
    if (message.fromMe) return;
    if (message.isGroupMsg || message.from.includes('@g.us')) return;

    const approvalMap = this.getSessionMap(this.pendingApprovals, sessionId);
    const sessionMap = this.getSessionMap(this.pendingApprovals, sessionId);

    if (approvalMap.has(message.from)) {
      const state = approvalMap.get(message.from);

      if (state?.etapa === 'escolher_nicho') {

        const index = parseInt(message.body) - 1;

        if (isNaN(index) || !state.nichosDisponiveis[index])
          return client.sendText(message.from, 'Opção inválida.');

        const nichoEscolhido = state.nichosDisponiveis[index];

        sessionMap.delete(message.from);

        return this.executarFluxoProduto(
          client,
          message,
          sessionId,
          state.link,
          [nichoEscolhido]
        );
      }

      return this.handleApprovalResponse(client, message, sessionId);
    }

    const broadcastMap = this.getSessionMap(this.pendingBroadcast, sessionId);

    if (broadcastMap.has(message.from)) {

      const state = broadcastMap.get(message.from);
      const bodyRaw = (message.body || '').trim();

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

        console.log('SESSION ID RECEBIDO NO BOT:', sessionId);
        const groups = (await nicheGroupService.listBySession(sessionId))
          .filter(g => g.active);
        const nichosUnicos = [...new Set(groups.map(g => g.niche))];
        const broadcastMap = this.getSessionMap(this.pendingBroadcast, sessionId);

        if (!nichosUnicos.length) {
          broadcastMap.delete(message.from)
          return client.sendText(message.from, 'Nenhum nicho configurado.');
        }

        state.nichosDisponiveis = nichosUnicos;
        state.etapa = 'menu';

        let menu = `Escolha o nicho:\n\n`;

        nichosUnicos.forEach((n, i) => {
          menu += `[${i + 1}] - ${n}\n`;
        });

        menu += `[0] - Cancelar`;

        if (state.imagePath) {

          await client.sendImage(
            message.from,
            state.imagePath,
            'aviso.jpg',
            `🛠️ Preview do aviso:\n\n${state.texto || ''}\n\n${menu}`
          );

        } else {

          await client.sendText(
            message.from,
            `🛠️ Preview do aviso:\n\n${state.texto || ''}\n\n${menu}`
          );

        }

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

        const groupsData = await nicheGroupService.getGroupsBySession(sessionId);
        const groups = groupsData
          .filter(g => g.niche === state.niche && g.active)
          .map(g => g.group_id);

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

    const body = (message.caption || message.body || '').trim();
    const urlDetectada = body.match(/https?:\/\/\S+/)?.[0];
    if (!urlDetectada) return;

    const parts = body.split(' ').filter(Boolean);

    if (parts.length === 1) {
      console.log('SESSION ID NO BOT:', sessionId);

      const groups = (await nicheGroupService.listBySession(sessionId))
        .filter(g => g.active);

      console.log('GROUPS RETORNADOS:', groups);
      const nichosUnicos = [...new Set(groups.map(g => g.niche))];

      if (!nichosUnicos.length)
        return client.sendText(message.from, 'Nenhum nicho configurado.');

      sessionMap.set(message.from, {
        etapa: 'escolher_nicho',
        link: urlDetectada,
        nichosDisponiveis: nichosUnicos
      });

      let menu = 'Escolha o nicho:\n\n';
      nichosUnicos.forEach((n, i) => {
        menu += `[${i + 1}] - ${n}\n`;
      });

      return client.sendText(message.from, menu);
    }

    if (parts.length >= 2) {

      const possivelNicho = parts[0];

      const nichoValidado = await this.identificarNicho(sessionId, possivelNicho);

      if (!nichoValidado)
        return client.sendText(message.from, 'Nicho não encontrado.');

      return this.executarFluxoProduto(
        client,
        message,
        sessionId,
        urlDetectada,
        [nichoValidado]
      );
    }
  }

  async executarFluxoProduto(client, message, sessionId, url, nichos) {
    try {

      const dadosScraper = await this.scraperService.fetchProducts(url);
      const produtoUrlReal = dadosScraper.url || url;

      let linkAfiliado;

      try {
        linkAfiliado = await this.affiliateService.generateAffiliateLink(produtoUrlReal);
      } catch {
        linkAfiliado = produtoUrlReal;
      }

      let imagemParaEnviar;

      if (dadosScraper.imageUrl) {
        imagemParaEnviar = await this.downloadImageToTemp(dadosScraper.imageUrl);
      } else {
        throw new Error('Nenhuma imagem disponível');
      }

      const imagemComMarca = await ImageService.applyWatermark(imagemParaEnviar);
      const sessionMap = this.getSessionMap(this.pendingApprovals, sessionId);

      sessionMap.set(message.from, {
        etapa: 'menu',
        produto: dadosScraper,
        link: linkAfiliado,
        niches: nichos,
        imagePath: imagemParaEnviar,
        config: {}
      });

      await client.sendImage(
        message.from,
        imagemComMarca,
        'produto.jpg',
        this.buildMessage(dadosScraper, linkAfiliado)
      );

      fs.unlink(imagemComMarca, () => { });

      await client.sendText(message.from,
        `O que deseja fazer?

[1] - ✅ Enviar
[2] - ✏️ Editar título
[3] - 💰 Editar preço
[7] - ⚡ Disparo instantâneo
[0] - ❌ Cancelar`);

    } catch (err) {
      console.error(err);
      await client.sendText(message.from, 'Erro ao processar produto.');
    }
  }
}



module.exports = BotService;