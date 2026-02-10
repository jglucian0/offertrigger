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

  static formatCouponText(coupon) {
    if (!coupon) return null;

    if (coupon.type === 'percent') {
      if (!coupon.value || coupon.value <= 0) return null;
      return `+${coupon.value}% OFF`;
    }

    if (coupon.type === 'money') {
      if (!coupon.value || coupon.value <= 0) return null;
      return `+R$${coupon.value} OFF`;
    }

    return null;
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

    const extraInfoText = product.extraInfo
      ? `\n\n\`${product.extraInfo}\``
      : '';

    const couponFormatted = this.formatCouponText(product.coupon);
    let couponText = '';
    if (couponFormatted) {

      if (product.couponApplied) {
        couponText = `\n\n\`${emojiCoupon}Cupom aplicado: ${couponFormatted}\``;
      }

      else if (product.couponMinimum && product.currentPriceValue < product.couponMinimum) {
        couponText = `\n\n\`${emojiCoupon}Ative o cupom: ${couponFormatted} em compras acima de R$ ${product.couponMinimum.toFixed(2).replace('.', ',')}\``;
      }

      else {
        couponText = `\n\n\`${emojiCoupon}Ative o cupom: ${couponFormatted}\``;
      }
    }

    const storeName = this.detectStore(product.link);

    return `${titulo}

${oldPriceText}
${shippingText}${discountText}${soldQuantity}${couponText}${extraInfoText}

Achado ${storeName}:
${product.link}`;
  }
}

module.exports = MessageFormatter;