const wppconnect = require('@wppconnect-team/wppconnect');

class WppService {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  async initSession(userId) {
    try {
      // Adicionamos o log para debug no WSL
      console.log(`[WppService] Iniciando instância para: ${userId}`);

      const client = await wppconnect.create({
        session: userId,
        executablePath: '/usr/bin/google-chrome',
        catchQR: (base64Qr) => {
          // Check de segurança: só atualiza se o manager ainda existir (evita erro no Jest)
          if (this.sessionManager) {
            this.sessionManager.updateSession(userId, { qrcode: base64Qr, status: 'qrcode' });
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
        headless: true, // No WSL deve ser true a menos que tenha X11 configurado
        useChrome: false,
        puppeteerOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Ajuda na memória do WSL/Docker
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process' // Ajuda a evitar processos órfãos no fechamento do teste
          ],
        },
      });

      // Se o manager ainda estiver ativo, salva o cliente conectado
      if (this.sessionManager) {
        this.sessionManager.updateSession(userId, {
          client: client,
          status: 'connected',
          qrcode: null
        });
      }

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
      // Busca todos os chats e filtra apenas os que são grupos
      const chats = await session.client.listChats();
      const groups = chats.filter(chat => chat.isGroup);

      return groups.map(group => ({
        id: group.id._serialized, // O ID que usaremos para enviar mensagens (@g.us)
        name: group.name || group.contact.name,
        unreadCount: group.unreadCount
      }));
    }
    throw new Error('Sessão não conectada');
  }

  async sendText(userId, to, message) {
    const session = this.sessionManager.getSession(userId);

    if (session && session.client) {
      // 1. Tratamento do número: remove espaços, traços e garante o sufixo
      let destination = to.replace(/\D/g, ''); // Mantém apenas números

      // Se não tiver o sufixo, adiciona. 
      // Grupos geralmente já vem com @g.us, se não, assumimos @c.us
      if (!destination.includes('@')) {
        const isGroup = destination.length > 15; // IDs de grupo são longos
        destination = isGroup ? `${destination}@g.us` : `${destination}@c.us`;
      }

      console.log(`[WppService] Tentando envio robusto para: ${destination}`);

      // 2. Usar o checkContact antes de enviar (evita o erro de LID)
      try {
        return await session.client.sendText(destination, message);
      } catch (err) {
        // Se falhar, tentamos uma segunda vez limpando o cache de contatos
        console.warn(`[WppService] Primeira tentativa falhou, tentando fallback...`);
        return await session.client.sendText(destination, message);
      }
    }

    throw new Error('WhatsApp não está conectado para este usuário');
  }

  async sendImage(userId, to, imageUrl, caption) {
    const session = this.sessionManager.getSession(userId);
    if (session && session.client) {
      // Garante o formato correto do destino (@g.us ou @c.us)
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