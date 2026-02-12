const wppconnect = require('@wppconnect-team/wppconnect');
const AffiliateService = require('../services/affiliate/affiliateService');
const BotService = require('./botService');

class WppService {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    const affiliateService = new AffiliateService();
    this.botService = new BotService(affiliateService);
  }

  getClient(userId) {
    const session = this.sessionManager.getSession(userId);
    if (!session || !session.client) {
      return null
    }
    return session.client;
  }

  async initSession(userId) {
    try {
      console.log(`[WppService] Iniciando instância para: ${userId}`);

      const client = await wppconnect.create({
        session: userId,
        executablePath: '/usr/bin/google-chrome',
        catchQR: (base64Qr) => {
          if (this.sessionManager) {
            this.sessionManager.updateSession(userId, {
              qrcode: base64Qr,
              status: 'qrcode'
            });
          }
        },
        statusFind: (statusSession, session) => {
          console.log(`Status da sessão ${session}: `, statusSession);
          if (this.sessionManager) {
            this.sessionManager.updateSession(userId, { status: statusSession });
          }
        },
        autoClose: 0,
        waitForLogin: false,
        headless: true,
        useChrome: false,
        puppeteerOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
          ],
        },
      });

      if (this.sessionManager) {
        this.sessionManager.updateSession(userId, {
          client: client,
          status: 'connected',
          qrcode: null
        });
      }

      client.onMessage(async (message) => {
        await this.botService.processIncomingMessage(client, message);
      });

      return client;
    } catch (error) {
      console.error(`Erro ao iniciar sessão ${userId}:`, error);
      if (this.sessionManager) {
        this.sessionManager.updateSession(userId, { status: 'error' });
      }
    }
  }

  async getAllGroups(userId) {
    const session = this.sessionManager.getSession(userId);
    if (session && session.client) {
      const chats = await session.client.listChats();
      const groups = chats.filter(chat => chat.isGroup);

      return groups.map(group => ({
        id: group.id._serialized,
        name: group.name || group.contact.name,
        unreadCount: group.unreadCount
      }));
    }
    throw new Error('Sessão não conectada');
  }

  async sendText(userId, to, message) {
    const session = this.sessionManager.getSession(userId);

    if (session && session.client) {
      let destination = to.replace(/\D/g, '');

      if (!destination.includes('@')) {
        const isGroup = destination.length > 15;
        destination = isGroup ? `${destination}@g.us` : `${destination}@c.us`;
      }

      console.log(`[WppService] Tentando envio robusto para: ${destination}`);

      try {
        return await session.client.sendText(destination, message);
      } catch (err) {
        console.warn(`[WppService] Primeira tentativa falhou, tentando fallback...`);
        return await session.client.sendText(destination, message);
      }
    }

    throw new Error('WhatsApp não está conectado para este usuário');
  }

  async sendImage(userId, to, imageUrl, caption) {
    const session = this.sessionManager.getSession(userId);
    if (session && session.client) {
      const destination = to.includes('@') ? to : (to.length > 15 ? `${to}@g.us` : `${to}@c.us`);

      console.log(`[WppService] Enviando imagem para: ${destination}`);
      return await session.client.sendImage(
        destination,
        imageUrl,
        'produto.jpg',
        caption
      );
    }
    throw new Error('Sessão não conectada ou cliente offline');
  }
}

module.exports = WppService;