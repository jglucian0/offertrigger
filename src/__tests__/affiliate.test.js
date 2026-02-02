const AffiliateService = require('../services/affiliateService');

describe('Issue #07 - Link Builder Automatizado', () => {
  test('Deve converter um link normal em link de afiliado via Builder', async () => {
    // Use o início do seu token para o teste (em produção usaremos .env)
    const token = 'c3NpZD1naHktMDIwMTE3LThpSGtKb1F0ZlhRYVFOUUpjdEh5UzlIcklWRU1nUS1fXy03NTc2MDE5OTYtX18tMTg2NDY3NDA3ODU3NC0tUlJSXzAtUlJSXzA=';
    const service = new AffiliateService(token);

    const original = 'https://www.mercadolivre.com.br/carretilha-abu-garcia-black-max-bmax3-81kg-641-nova-c-nf/up/MLBU3331937922#reco_item_pos=3&reco_backend=item_decorator&reco_backend_type=function&reco_client=home_items-decorator-legacy&reco_id=7de8cb53-1c12-46d3-b550-e8f9f9b6c842&reco_model=&c_id=/home/navigation-trends-recommendations/element&c_uid=11f5a780-cb10-4855-b744-7d1da9c696f1&da_id=navigation_trend&da_position=2&id_origin=/home/dynamic_access&da_sort_algorithm=ranker';
    const affiliate = await service.generateAffiliateLink(original);

    expect(affiliate).toBeDefined();
    expect(affiliate).toContain('mercadolivre.com/sec/');
    console.log('Link de Afiliado Gerado:', affiliate);
  }, 50000);
});