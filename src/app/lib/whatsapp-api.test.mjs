import assert from 'node:assert/strict';
import test from 'node:test';

const {
  getWhatsappConfig,
  isWhatsappAutomationConfigured,
  isWhatsappAutomationEnabled,
  normalizeWhatsappRecipient,
  verifyMetaSignature,
  verifyWhatsappWebhookToken,
} = await import('./whatsapp-api.ts');

const ENV_KEYS = [
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_APP_SECRET',
  'WHATSAPP_AUTOMATION_ENABLED',
  'WHATSAPP_PRODUCT_INTEREST_TEMPLATE',
  'WHATSAPP_TEMPLATE_LANGUAGE',
];

async function withCleanEnv(fn) {
  const previous = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

  for (const key of ENV_KEYS) {
    delete process.env[key];
  }

  try {
    return await fn();
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('normalizes WhatsApp recipients to digits', () => {
  assert.equal(normalizeWhatsappRecipient('+54 9 11 2511-5030'), '5491125115030');
  assert.equal(normalizeWhatsappRecipient('abc'), null);
});

test('reads WhatsApp config with safe defaults', async () => {
  await withCleanEnv(() => {
    const config = getWhatsappConfig();

    assert.equal(config.graphApiVersion, 'v26.0');
    assert.equal(config.productInterestTemplate, 'product_interest_seller');
    assert.equal(config.templateLanguage, 'es_AR');
    assert.equal(isWhatsappAutomationConfigured(), false);
    assert.equal(isWhatsappAutomationEnabled(), false);
  });
});

test('requires flag and config before enabling WhatsApp automation', async () => {
  await withCleanEnv(() => {
    process.env.WHATSAPP_AUTOMATION_ENABLED = 'true';
    assert.equal(isWhatsappAutomationEnabled(), false);

    process.env.WHATSAPP_ACCESS_TOKEN = 'token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123';
    assert.equal(isWhatsappAutomationConfigured(), true);
    assert.equal(isWhatsappAutomationEnabled(), true);
  });
});

test('validates webhook verify token when configured', async () => {
  await withCleanEnv(async () => {
    process.env.WHATSAPP_VERIFY_TOKEN = 'verify-me';

    const response = verifyWhatsappWebhookToken(
      'subscribe',
      'verify-me',
      'challenge-123'
    );

    assert.ok(response);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'challenge-123');
    assert.equal(
      verifyWhatsappWebhookToken('subscribe', 'wrong', 'challenge-123'),
      null
    );
  });
});

test('accepts webhook signature checks when no app secret is configured', () => {
  return withCleanEnv(() => {
    assert.equal(verifyMetaSignature('{"ok":true}', null), true);
  });
});
