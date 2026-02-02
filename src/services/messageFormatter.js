class MessageFormatter {
  static format(product) {
    const shippingText = product.freeShipping ? `\n\`🚚 FRETE GRÁTIS!\`` : '';
    const discountText = product.discount ? `\n\`🎟️ ${product.discount}\`` : '';

    const oldPriceText = product.oldPrice
      ? `De ~~${product.oldPrice}~~ | *${product.price}* 💵`
      : `Por apenas *${product.price}*`

    return `${product.title}

${oldPriceText}
${shippingText}${discountText}

Achado no Mercado Livre
${product.link}`;
  }
}

module.exports = MessageFormatter;