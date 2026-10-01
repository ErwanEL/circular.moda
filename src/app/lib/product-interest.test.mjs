import assert from 'node:assert/strict';
import test from 'node:test';

const {
  CIRCULAR_WHATSAPP_NUMBER,
  buildBuyerIntroductionMessage,
  buildCircularProductInterestMessage,
  buildFallbackCircularWhatsappUrl,
  buildGroupIntroductionMessage,
  buildSellerIntroductionMessage,
  buildSellerProductInterestTemplateParameters,
  buildSellerProductInterestTemplateText,
  buildWhatsappUrl,
  isIntroductionStatus,
} = await import('./product-interest.ts');

const product = {
  sku: 'SKU-001357',
  name: 'Vestido negro',
  size: '2',
  color: 'Negro',
  url: 'https://www.circular.moda/products/vestido-negro',
};

test('builds the Circular WhatsApp message with request code and product data', () => {
  const message = buildCircularProductInterestMessage({
    code: 'INT-ABC123',
    product,
  });

  assert.match(message, /Código: INT-ABC123/);
  assert.doesNotMatch(message, /Nombre:/);
  assert.match(message, /SKU: SKU-001357/);
  assert.match(message, /Vestido negro/);
  assert.match(message, /Link: https:\/\/www\.circular\.moda\/products\/vestido-negro/);
  assert.match(message, /comparta mi nombre y WhatsApp con la vendedora/);
});

test('builds the Circular WhatsApp message with buyer contact when available', () => {
  const message = buildCircularProductInterestMessage({
    code: 'INT-ABC123',
    product,
    buyerName: 'Romy',
    buyerPhone: '+5491122223333',
  });

  assert.match(message, /Nombre: Romy/);
  assert.match(message, /WhatsApp: \+5491122223333/);
});

test('builds wa.me URLs with normalized phone digits', () => {
  const url = buildWhatsappUrl('+54 9 11 2511-5030', 'Hola Circular');

  assert.equal(
    url,
    'https://wa.me/5491125115030?text=Hola%20Circular'
  );
});

test('falls back to the legacy Circular message when interest creation fails', () => {
  const url = buildFallbackCircularWhatsappUrl(product);

  assert.ok(url.startsWith(`https://wa.me/${CIRCULAR_WHATSAPP_NUMBER}`));
  assert.match(decodeURIComponent(url), /SKU: SKU-001357/);
});

test('builds seller, buyer and group introduction templates', () => {
  assert.equal(
    buildSellerIntroductionMessage({
      code: 'INT-ABC123',
      product,
      sellerName: 'Lara Alvarez',
      buyerName: 'Romy',
      availabilityConfirmed: true,
    }),
    [
      'Hola Lara, Romy está interesada en tu prenda SKU-001357.',
      'Prenda: Vestido negro',
      'Talla: 2 · Color: Negro',
      '',
      'La disponibilidad ya está confirmada.',
      'Te voy a sumar a un grupo con ella para que puedan coordinar pago y entrega directamente.',
    ].join('\n')
  );

  assert.match(
    buildBuyerIntroductionMessage({
      code: 'INT-ABC123',
      product,
      sellerName: 'Lara Alvarez',
      buyerName: 'Romy',
      availabilityConfirmed: true,
    }),
    /Te voy a sumar a un grupo con Lara/
  );

  assert.match(
    buildGroupIntroductionMessage({
      code: 'INT-ABC123',
      product,
      sellerName: 'Lara Alvarez',
      buyerName: 'Romy',
      availabilityConfirmed: true,
    }),
    /Hola Romy y Lara/
  );
});

test('builds seller product interest WhatsApp template content', () => {
  const input = {
    sellerName: 'Lara Alvarez',
    buyerName: 'Romy Gomez',
    buyerPhone: '+5491122223333',
    product,
  };

  const text = buildSellerProductInterestTemplateText(input);
  assert.match(text, /Hola Lara, Romy está interesada/);
  assert.match(text, /SKU: SKU-001357/);
  assert.match(text, /WhatsApp de la compradora: \+5491122223333/);

  assert.deepEqual(buildSellerProductInterestTemplateParameters(input), [
    { type: 'text', text: 'Lara' },
    { type: 'text', text: 'Romy' },
    { type: 'text', text: 'Vestido negro' },
    { type: 'text', text: 'SKU-001357' },
    { type: 'text', text: '+5491122223333' },
    {
      type: 'text',
      text: 'https://www.circular.moda/products/vestido-negro',
    },
  ]);
});

test('validates introduction statuses', () => {
  assert.equal(isIntroductionStatus('new'), true);
  assert.equal(isIntroductionStatus('sale_coordinated'), true);
  assert.equal(isIntroductionStatus('unknown'), false);
});
