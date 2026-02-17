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
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  identificarNicho(termo) {
    const termoNormalizado = this.normalizeText(termo);

    return this.nichosValidos.find(niche =>
      niche.substring(0, 4) === termoNormalizado.substring(0, 4)
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
      link: 'link de afiliado',
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
      if (text === '1') {
        const mensagem = MessageFormatter.format({
          ...state.produto,
          link: state.link,
          ...state.config
        });

        const offersPath = path.resolve(__dirname, '../../storage/offers');
        if (!fs.existsSync(offersPath)) {
          fs.mkdirSync(offersPath, { recursive: true });
        }

        let tempImage;

        if (state.imagePath) {
          tempImage = state.imagePath;
        } else {
          tempImage = await this.downloadImageToTemp(state.produto.imageUrl);
        }

        const finalImage = await ImageService.applyWatermark(tempImage);

        const finalName = `offer_${Date.now()}.jpg`;
        const finalPath = path.join(offersPath, finalName);

        fs.renameSync(finalImage, finalPath);
        fs.unlink(tempImage, () => { });

        console.log({
          original: state.original_price,
          current: state.current_price,
          discount: state.discount,
          free: state.free_shipping
        });

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
          })
        }

        await client.sendText(message.from,
          `📦 Produto salvo na fila de disparo para: ${state.niches.join(", ")}`);

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

      if (text === '6') {
        state.etapa = 'edit_extra';
        await client.sendText(message.from,
          '📝 Digite a informação adicional que deseja inserir na oferta:');
        return;
      }

      if (text === '7') {

        const mensagem = MessageFormatter.format({
          ...state.produto,
          link: state.link,
          ...state.config
        });

        let tempImage;

        if (state.imagePath) {
          tempImage = state.imagePath;
        } else {
          tempImage = await this.downloadImageToTemp(state.produto.imageUrl);
        }

        const finalImage = await ImageService.applyWatermark(tempImage);

        for (const niche of state.niches) {

          const groupId = nicheGroups[niche];

          if (!groupId) continue;

          console.log(`[Bot] Disparo instantâneo → ${niche}`);

          await client.sendImage(
            groupId,
            finalImage,
            'produto.jpg',
            mensagem
          );
        }

        fs.unlink(finalImage, () => { });
        fs.unlink(tempImage, () => { });

        await client.sendText(message.from, '⚡ Disparo instantâneo concluído.');

        this.pendingApprovals.delete(message.from);
        return;
      }

      if (text === '8') {
        state.etapa = 'edit_ante';
        await client.sendText(message.from, '📌 Digite o antetítulo (ex: Loja oficial da Nike!)');
        return;
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

    if (state.etapa === 'edit_extra') {
      state.config.extraInfo = text;
      state.etapa = 'menu';
      return this.sendPreview(client, message.from, state);
    }

    if (state.etapa === 'edit_ante') {
      state.config.anteTitulo = text;
      state.etapa = 'menu';
      return this.sendPreview(client, message.from, state);
    }
  }

  async processIncomingMessage(client, message) {
    if (message.fromMe) return;

    if (this.pendingApprovals.has(message.from)) {
      return this.handleApprovalResponse(client, message);
    }

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

          const imagemComMarca = await ImageService.applyWatermark(imagemParaEnviar);


          this.pendingApprovals.set(message.from, {
            etapa: 'menu',
            produto: dadosScraper,
            link: linkAfiliado,
            linkOriginal: urlDetectada,
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

          // if (fotoCaminhoLocal) {
          //   fs.unlink(fotoCaminhoLocal, () => { });
          // }

          // if (imagemTemporaria && imagemParaEnviar) {
          //   fs.unlink(imagemParaEnviar, () => { });
          // }
        } catch (err) {
          console.error('[Bot] Erro no processamento:', err.message);
        }

      }
    }
  }
}

module.exports = BotService;