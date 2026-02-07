class MessageFormatter {
  static detectStore(link) {
    if (!link) return 'na internet';

    if (link.startsWith('https://mercadolivre.com/sec/'))
      return 'no Mercado Livre';

    if (link.startsWith('https://amzn.to/'))
      return 'na Amazon';

    return 'na internet';
  }

  static formatPrice(reais, cents) {
    if (!reais) return null;
    return `R$ ${reais},${cents || '00'}`;
  }


  static format(product) {
    const titulo = product.tituloCustom || product.title;

    let price = product.precoCustom
      ? `R$ ${product.precoCustom}`
      : this.formatPrice(product.currentPriceReais, product.currentPriceCents);

    let oldPrice = product.removerPrecoAntigo
      ? null
      : this.formatPrice(product.oldPriceReais, product.oldPriceCents);

    const emojiMoney = product.semEmoji ? '' : ' 💵';
    const emojiDiscount = product.semEmoji ? '' : '🎟️ ';
    const emojiShipping = product.semEmoji ? '' : '🚚 ';

    const shippingText = product.shipping
      ? `\n\`${emojiShipping}${product.shipping}\``
      : '';

    const discountText = product.discountPercent
      ? `\n\`${emojiDiscount}${product.discountPercent}% OFF\``
      : '';

    const oldPriceText = oldPrice
      ? `De ~${oldPrice}~ | Por *${price}*${emojiMoney}`
      : `Por apenas *${price}*${emojiMoney}`;

    const storeName = this.detectStore(product.link);

    return `${titulo}

${oldPriceText}
${shippingText}${discountText}

Achado ${storeName}:
${product.link}`;
  }
}

module.exports = MessageFormatter;