/**
 * @file Utils.gs
 * @description ログ出力、キャッシュクリア、文字列整形などの共通ユーティリティ機能を提供します。
 */

/**
 * 統一フォーマットでログ出力および例外処理を行います。
 *
 * @param {string} context 実行された文脈または関数名
 * @param {Error|string} error 発生したエラーオブジェクトまたはメッセージ
 * @throws {Error} フォーマット済みの例外をスロー
 */
function logError(context, error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[SharedLibrary Error][${context}] ${message}`);
  throw new Error(`[${context}] ${message}`);
}

/**
 * 指定されたキーの配列に対応する CacheService のキャッシュを一括クリアします。
 *
 * @param {string[]} keys 削除対象のキャッシュキー配列
 */
function clearCachesByKeys(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return;
  try {
    const cache = CacheService.getScriptCache();
    keys.forEach(key => {
      if (key) cache.remove(key);
    });
  } catch (e) {
    console.warn('[Utils] キャッシュ一括削除中に警告が発生しました:', e.message);
  }
}

/**
 * SharedLibrary が保持している CacheService の既定キャッシュ（汎用設定のみ）をすべてクリアします。
 */
function clearSharedCache() {
  const defaultKeys = [
    SHARED_CONFIG.CACHE_KEYS.HOLIDAYS_MAP,
    SHARED_CONFIG.CACHE_KEYS.HOLIDAYS_LIST
  ];
  clearCachesByKeys(defaultKeys);
}

/**
 * 複数のメールアドレス文字列を結合し、重複排除およびフォーマット整形を行います。
 *
 * @param {...string} emailStrings カンマ区切りのメールアドレス文字列
 * @return {string} カンマ区切りの一意なメールアドレス文字列
 */
function mergeAndSanitizeEmails(...emailStrings) {
  const emails = [];
  emailStrings.forEach(str => {
    if (str) {
      const arr = String(str).replace(/[\s ]+/g, '').replace(/[、，]/g, ',').split(',');
      emails.push(...arr);
    }
  });
  const uniqueEmails = [...new Set(emails.filter(e => e !== ''))];
  return uniqueEmails.join(',');
}