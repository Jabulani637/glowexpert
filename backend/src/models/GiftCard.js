const { query, run } = require('../db');
const crypto = require('crypto');

function getCurrentTimestamp() {
  return new Date().toISOString();
}

async function ensureGiftCardSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ZAR',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code)`);
}

async function findGiftCardByCode(code) {
  const { rows } = await query(
    'SELECT * FROM gift_cards WHERE code = $1 LIMIT 1',
    [code]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function redeemGiftCard(code, amount) {
  const card = await findGiftCardByCode(code);
  if (!card) throw new Error('Gift card not found');
  if (card.status !== 'active') throw new Error('Gift card is not active');
  if (card.balance < amount) throw new Error('Insufficient gift card balance');

  const newBalance = card.balance - amount;
  const newStatus = newBalance <= 0 ? 'redeemed' : 'active';

  await run(
    'UPDATE gift_cards SET balance = $1, status = $2, updated_at = $3 WHERE code = $4',
    [newBalance, newStatus, getCurrentTimestamp(), code]
  );

  return { ...card, balance: newBalance, status: newStatus };
}

module.exports = {
  ensureGiftCardSchema,
  findGiftCardByCode,
  redeemGiftCard
};
