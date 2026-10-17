/**
 * @file ValidationUtils.gs
 * @description データ検証および文字列のサニタイズ機能を提供します。
 */

/**
 * メールアドレスの形式妥当性を検証します。
 *
 * @param {string} email 検証対象のメールアドレス
 * @return {boolean} 形式が正しい場合は true
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * HTMLの特殊文字をエスケープし、XSS（クロスサイトスクリプティング）を防止します。
 *
 * @param {string} str エスケープ対象の文字列
 * @return {string} エスケープ済みの文字列
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 値が有効な数値であるか（空文字や空白・NaN でないか）を判定します。
 *
 * @param {*} value 判定対象の値
 * @return {boolean} 有効な数値である場合は true
 */
function isNumeric(value) {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(Number(value)) && isFinite(Number(value));
}