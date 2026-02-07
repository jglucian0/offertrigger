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

  static formatCouponText(couponText) {
    if (!couponText) return null;

    const match = couponText.match(/(\d{1,3})\s*%/);

    if (!match) return null;

    const percent = Number(match[1]);

    if (!percent || percent <= 0) return null;

    return `+${percent}% OFF`;
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
    const emogiSQuantity = product.semEmoji ? '' : '🔥 ';
    const emojiCoupon = product.semEmoji ? '' : '⚠️ ';

    const shippingText = product.shipping
      ? `\n\`${emojiShipping}FRETE GRÁTIS!\`` //${product.shipping}
      : '';

    const discountText = product.discountPercent
      ? `\n\`${emojiDiscount}${product.discountPercent}% OFF\``
      : '';

    const soldQuantity = product.soldQuantity
      ? `\n\`${emogiSQuantity}${product.soldQuantity}!\``
      : '';

    const oldPriceText = oldPrice
      ? `De ~${oldPrice}~ | Por *${price}*${emojiMoney}`
      : `Por apenas *${price}*${emojiMoney}`;

    const couponFormatted = this.formatCouponText(product.coupon);
    const couponText = couponFormatted
      ? `\n\n\`${emojiCoupon}Ative o cupom: ${couponFormatted}\``
      : '';

    const storeName = this.detectStore(product.link);

    return `${titulo}

${oldPriceText}
${shippingText}${discountText}${soldQuantity}${couponText}

Achado ${storeName}:
${product.link}`;
  }
}

module.exports = MessageFormatter;