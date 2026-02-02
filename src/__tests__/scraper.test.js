const ScraperService = require('../services/scraperService');

describe('Issue #05 - Scraper Social List (Produção)', () => {
  test('Deve extrair múltiplos produtos da Social List do Mercado Livre', async () => {
    const scraper = new ScraperService();
    const url = 'https://mercadolivre.com/sec/1Q1NTGY';

    const products = await scraper.fetchProducts(url);

    // Primeiro validamos se retornou um array com itens
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);

    const p = products[0];

    // Agora validamos as propriedades individualmente
    expect(p.title).toBeDefined();
    expect(p.price).toBeDefined();
    expect(p.link).not.toBeNull();
  }, 40000);
});