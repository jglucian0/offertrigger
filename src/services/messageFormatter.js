class MessageFormatter {
  static format(product) {
    const shippingText = product.freeShipping ? '🚚 *FRETE GRÁTIS!*' : '';
    const discountText = product.discount ? `(${product.discount})` : '';

    return `🔥 *${product.title}*

💰 ~~${product.oldPrice || ''}~~ por apenas:
✅ *${product.price}* ${discountText}

${shippingText}

👉 *Compre aqui:* ${product.link}

---
⚠️ _Oferta sujeita a alteração de preço a qualquer momento_`;
  }
}

module.exports = MessageFormatter;