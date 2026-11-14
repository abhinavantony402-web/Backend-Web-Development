'use strict';

// ─── YOUR FILE — implement this ───────────────────────────────────────────────
const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

// In-memory store of processed event IDs (exported for test inspection/reset)
const _processedIds = new Set();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'testsecret';

function handleWebhook(req, res) {
  // Step 1: Verify HMAC-SHA256 signature
  const sigHeader = req.headers['x-webhook-signature'];

  if (!sigHeader) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Compute expected signature over raw Buffer body
  const expectedHex = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.body) // req.body is a Buffer thanks to express.raw()
    .digest('hex');

  const expectedSig = Buffer.from('sha256=' + expectedHex);
  const receivedSig = Buffer.from(sigHeader);

  // Timing-safe comparison (buffers must be the same length)
  let valid = false;
  try {
    valid =
      expectedSig.length === receivedSig.length &&
      crypto.timingSafeEqual(expectedSig, receivedSig);
  } catch {
    valid = false;
  }

  if (!valid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Step 2: Parse body after verification
  const event = JSON.parse(req.body);

  // Step 3: Idempotency check
  if (_processedIds.has(event.id)) {
    return res.status(200).json({ status: 'already_processed' });
  }

  // Step 4: Mark as processed BEFORE responding (prevents re-processing on retry)
  _processedIds.add(event.id);

  // Step 5: Acknowledge immediately, then process asynchronously
  res.status(200).json({ status: 'received' });

  setImmediate(() => {
    handleEvent(event);
  });
}

module.exports = { handleWebhook, _processedIds };
