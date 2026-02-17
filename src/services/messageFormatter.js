class MessageFormatter {

  static detectStore(link) {
    if (!link) return 'na internet';
    if (link.startsWith('https://mercadolivre.com/sec/')) return 'no Mercado Livre';
    if (link.startsWith('https://amzn.to/')) return 'na Amazon';
    return 'na internet';
  }

  static formatPrice(reais, cents = '00') {
    if (!reais) return null;
    return `R$ ${reais},${cents}`;
  }

  static formatCouponText(coupon) {
    if (!coupon?.value || coupon.value <= 0) return null;

    if (coupon.type === 'percent') return `+${coupon.value}% OFF`;
    if (coupon.type === 'money') return `+R$${coupon.value} OFF`;

    return null;
  }

  static format(product) {

    const tituloBase = product.tituloCustom || product.title;
    const anteTitulo = product.anteTitulo ? `*${product.anteTitulo}*\n\n` : '';
    const titulo = `${anteTitulo}${tituloBase}`;

    const price = product.precoCustom
      ? `R$ ${product.precoCustom}`
      : this.formatPrice(product.currentPriceReais, product.currentPriceCents);

    const oldPrice = product.removerPrecoAntigo
      ? null
      : this.formatPrice(product.oldPriceReais, product.oldPriceCents);

    const emoji = product.semEmoji
      ? { m: '', d: '', s: '', q: '', c: '' }
      : { m: ' 💵', d: '🎟️ ', s: '🚚 ', q: '🔥 ', c: '⚠️ ' };

    const shippingText = product.shipping ? `\n\`${emoji.s}FRETE GRÁTIS!\`` : '';
    const discountText = product.discountPercent ? `\n\`${emoji.d}${product.discountPercent}% OFF\`` : '';
    const soldQuantity = product.soldQuantity ? `\n\`${emoji.q}${product.soldQuantity}!\`` : '';

    const oldPriceText = oldPrice
      ? `De ~${oldPrice}~ | Por *${price}*${emoji.m}`
      : `Por apenas *${price}*${emoji.m}`;

    const extraInfoText = product.extraInfo ? `\n\n\`${product.extraInfo}\`` : '';

    const couponFormatted = this.formatCouponText(product.coupon);
    let couponText = '';

    if (couponFormatted) {

      if (product.couponApplied) {
        couponText = `\n\n\`${emoji.c}Cupom aplicado: ${couponFormatted}\``;
      }

      else if (product.couponMinimum && product.currentPriceValue < product.couponMinimum) {
        couponText =
          `\n\n\`${emoji.c}Ative o cupom: ${couponFormatted} em compras acima de R$ ${product.couponMinimum.toFixed(2).replace('.', ',')}\``;
      }

      else {
        couponText = `\n\n\`${emoji.c}Ative o cupom: ${couponFormatted}\``;
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