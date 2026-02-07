class MessageFormatter {
  static detectStore(link) {
    if (!link) return 'na internet';

    if (link.startsWith('https://mercadolivre.com/sec/'))
      return 'no Mercado Livre';

    if (link.startsWith('https://amzn.to/'))
      return 'na Amazon';

    return 'na internet';
  }


  static format(product) {
    const price = product.currentPriceValue
      ? `R$ ${product.currentPriceReais},${product.currentPriceCents}`
      : null;

    const oldPrice = product.oldPriceValue
      ? `R$ ${product.oldPriceReais},${product.oldPriceCents}`
      : null;

    const shippingText = product.shipping
      ? `\n\`🚚 FRETE GRÁTIS!\`` //${product.shipping}
      : '';

    const discountText = product.discountPercent
      ? `\n\`🎟️ ${product.discountPercent}% OFF\``
      : '';

    const oldPriceText = oldPrice
      ? `De ~${oldPrice}~ | Por *${price}* 💵`
      : `Por apenas *${price}* 💵`;

    const storeName = this.detectStore(product.link);

    return `${product.title}

${oldPriceText}
${shippingText}${discountText}

Achado ${storeName}:
${product.link}`;
  }
}

module.exports = MessageFormatter;