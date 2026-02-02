const MessageFormatter = require('../services/messageFormatter');

describe('Issue #08 - Formatação de Mensagem de Oferta', () => {
  test('Deve gerar um texto formatado com emojis e destaque de preço', () => {
    const product = {
      title: 'Carregador Bateria Carro Moto',
      price: 'R$ 67',
      oldPrice: 'R$ 89',
      discount: '25% OFF',
      link: 'https://mercadolivre.com/afiliado-luciano',
      freeShipping: true
    };

    const message = MessageFormatter.format(product);

    expect(message).toContain('🔥');
    expect(message).toContain('Carregador Bateria Carro Moto');
    expect(message).toContain('R$ 67');
    expect(message).toContain('FRETE GRÁTIS');
  });
});