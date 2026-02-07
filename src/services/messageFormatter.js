class MessageFormatter {
  static format(product) {
    const price = product.currentPriceValue
      ? `R$ ${product.currentPriceReais},${product.currentPriceCents}`
      : null;

    const oldPrice = product.oldPriceValue
      ? `R$ ${product.oldPriceReais},${product.oldPriceCents}`
      : null;

    const shippingText = product.shipping
      ? `\n\`🚚 ${product.shipping}!\``
      : '';

    const discountText = product.discountPercent
      ? `\n\`🎟️ ${product.discountPercent}% OFF\``
      : '';

    const oldPriceText = oldPrice
      ? `De ~~${oldPrice}~~ | *${price}* 💵`
      : `Por apenas *${price}*`;

    return `${product.title}

${oldPriceText}
${shippingText}${discountText}

Achado no Mercado Livre:
${product.link}`;
  }
}

module.exports = MessageFormatter;