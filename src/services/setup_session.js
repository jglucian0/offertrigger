const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
puppeteer.use(StealthPlugin());

(async () => {
  const userDataDir = path.resolve(__dirname, '../../ml_session_data');

  console.log('🚀 Tentando abrir o Chrome para login manual...');

  const browser = await puppeteer.launch({
    headless: false, // Abre a janela
    userDataDir: userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--start-maximized',
      '--no-first-run'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.mercadolivre.com.br/afiliados/linkbuilder#hub', {
      waitUntil: 'networkidle2'
    });

    console.log('----------------------------------------------------');
    console.log('Janela aberta! Se ela não aparecer na frente,');
    console.log('procure por um ícone de pinguim ou Chrome na barra do Windows.');
    console.log('Após logar e chegar no Builder, feche o terminal.');
    console.log('----------------------------------------------------');

    // Mantém aberto até você fechar o terminal
    await new Promise(() => { });

  } catch (error) {
    console.error('Erro ao abrir o navegador:', error);
    await browser.close();
  }
})();