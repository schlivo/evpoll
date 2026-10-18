// Campaign key: short code printed (and encoded in the QR code / short URL /r/<key>)
// on the generic campaign documents (A4 note, A5 flyer, reminder poster).
// It is derived from the server secret and a version number, so it is never stored
// in clear; rotating it (new version) invalidates the printed one.
import crypto from 'crypto';
import db, { signValue } from './db.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const KEY_LENGTH = 6;

export const CAMPAIGN_KEY_REQUIRED = ['1', 'true', 'yes'].includes(String(process.env.CAMPAIGN_KEY_REQUIRED).toLowerCase());

const getVersion = () =>
  Number(db.prepare("SELECT value FROM meta WHERE key = 'campaign_key_version'").get()?.value) || 1;

/** Normalize what people type or what comes from the URL ("k7m-4qx" -> "K7M4QX") */
export const normalizeKey = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

/** Current campaign key */
export function getCampaignKey() {
  const digest = Buffer.from(signValue('campaign', String(getVersion())), 'hex');
  return Array.from(digest.subarray(0, KEY_LENGTH), b => ALPHABET[b % ALPHABET.length]).join('');
}

/**
 * @param {string} value - Key from the URL or typed by the respondent
 * @returns {boolean}
 */
export function verifyCampaignKey(value) {
  const given = normalizeKey(value);
  const expected = getCampaignKey();
  return given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** New key; the previous one stops working */
export function rotateCampaignKey() {
  db.prepare(`
    INSERT INTO meta (key, value) VALUES ('campaign_key_version', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(String(getVersion() + 1));
  return getCampaignKey();
}
