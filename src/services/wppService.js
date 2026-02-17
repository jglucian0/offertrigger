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
    return session?.client || null;
  }

  updateSession(userId, data) {
    if (!this.sessionManager) return;
    this.sessionManager.updateSession(userId, data);
  }

  getSession(userId) {
    return this.sessionManager.getSession(userId);
  }

  async initSession(userId) {
    try {
      console.log(`[WppService] Iniciando instância para: ${userId}`);

      const client = await wppconnect.create(this.createWppOptions(userId));

      this.updateSession(userId, { client });

      this.checkInitialState(userId, client);
      this.registerMessageListener(client);
      this.registerInterfaceListener(userId);

      return client;
    } catch (error) {
      console.error(`Erro ao iniciar sessão ${userId}:`, error);
      this.updateSession(userId, { status: 'error' });
    }
  }

  createWppOptions(userId) {
    return {
      session: userId,
      executablePath: '/usr/bin/google-chrome',
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

      catchQR: (base64Qr) => {
        this.updateSession(userId, {
          qrcode: base64Qr,
          status: 'qrcode'
        });
      },

      statusFind: (statusSession) => {
        //console.log(`Status da sessão ${userId}:`, statusSession);

        if (statusSession === 'isLogged') {
          this.updateSession(userId, {
            status: 'connected',
            qrcode: null
          });
          return;
        }

        if (statusSession !== 'inChat' && statusSession !== 'CONNECTED') {
          this.updateSession(userId, { status: 'connecting' });
        }
      }
    };
  }

  checkInitialState(userId, client) {
    setTimeout(async () => {
      try {
        const state = await client.getConnectionState();

        if (state === 'CONNECTED') {
          this.updateSession(userId, {
            status: 'connected',
            qrcode: null,
            interfaceReady: true
          });
        }
      } catch (e) {
        console.warn('[WPP] Falha ao checar estado inicial:', e.message);
      }
    }, 3000);
  }

  registerMessageListener(client) {
    client.onMessage(async (message) => {
      await this.botService.processIncomingMessage(client, message);
    });
  }

  registerInterfaceListener(userId) {
    const client = this.getClient(userId);

    if (!client) return;

    client.onInterfaceChange((state) => {

      if (state?.mode !== 'MAIN') return;

      const session = this.getSession(userId);
      if (!session || session.interfaceReady) return;

      this.updateSession(userId, {
        status: 'connected',
        qrcode: null,
        interfaceReady: true
      });
    });
  }

  async closeSession(userId) {
    const session = this.getSession(userId);
    if (!session?.client) return;

    try {
      await session.client.close();
    } catch (err) {
      console.warn(`[WPP] Erro ao fechar cliente ${userId}`, err.message);
    }
  }

  async getAllGroups(userId) {
    const session = this.getSession(userId);
    if (!session?.client) throw new Error('Sessão não conectada');

    const chats = await session.client.listChats();

    return chats
      .filter(chat => chat.isGroup)
      .map(group => ({
        id: group.id._serialized,
        name: group.name || group.contact.name,
        unreadCount: group.unreadCount
      }));
  }

  formatDestination(to) {
    if (to.includes('@')) return to;

    const clean = to.replace(/\D/g, '');
    const isGroup = clean.length > 15;

    return isGroup ? `${clean}@g.us` : `${clean}@c.us`;
  }

  async sendText(userId, to, message) {
    const session = this.getSession(userId);
    if (!session?.client) throw new Error('WhatsApp não está conectado');

    const destination = this.formatDestination(to);

    try {
      return await session.client.sendText(destination, message);
    } catch {
      console.warn(`[WppService] Primeira tentativa falhou, tentando fallback...`);
      return await session.client.sendText(destination, message);
    }
  }

  async sendImage(userId, to, imageUrl, caption) {
    const session = this.getSession(userId);
    if (!session?.client) throw new Error('Sessão não conectada ou cliente offline');

    const destination = this.formatDestination(to);

    //console.log(`[WppService] Enviando imagem para: ${destination}`);

    return await session.client.sendImage(
      destination,
      imageUrl,
      'produto.jpg',
      caption
    );
  }
}

module.exports = WppService;