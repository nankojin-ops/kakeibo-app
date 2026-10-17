/**
 * @file LockService.gs
 * @description LockServiceを利用した安全な排他制御およびリトライ処理機能を提供します。
 */

/**
 * ロックを取得した状態でコールバック関数を実行します。自動リトライ機能および解放処理を含みます。
 *
 * @param {Function} callback ロック取得下で実行する処理関数
 * @param {Object} [options={}] ロック設定オプション
 * @param {'script'|'document'|'user'} [options.type='script'] ロック種別
 * @param {number} [options.timeoutMs=10000] ロック試行タイムアウト（ミリ秒）
 * @param {number} [options.retries=2] ロック取得失敗時の最大リトライ回数
 * @param {number} [options.retryIntervalMs=1000] リトライ時の待機間隔（ミリ秒）
 * @return {*} コールバック関数の実行結果
 */
function withLock(callback, options = {}) {
  const type = options.type || 'script';
  const timeoutMs = options.timeoutMs || SHARED_CONFIG.LOCK_DEFAULTS.TIMEOUT_MS;
  const retries = options.retries !== undefined ? options.retries : SHARED_CONFIG.LOCK_DEFAULTS.RETRIES;
  const retryIntervalMs = options.retryIntervalMs || SHARED_CONFIG.LOCK_DEFAULTS.RETRY_INTERVAL_MS;

  let lockService;
  if (type === 'document') {
    lockService = LockService.getDocumentLock();
  } else if (type === 'user') {
    lockService = LockService.getUserLock();
  } else {
    lockService = LockService.getScriptLock();
  }

  let hasLock = false;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      hasLock = lockService.tryLock(timeoutMs);
      if (hasLock) break;
    } catch (e) {
      console.warn(`[LockService] ロック試行失敗 (${attempt + 1}/${retries + 1}):`, e.message);
    }
    attempt++;
    if (attempt <= retries) {
      Utilities.sleep(retryIntervalMs);
    }
  }

  if (!hasLock) {
    throw new Error(`[LockService] 混雑のため処理を開始できませんでした。時間をおいて再試行してください。(Type: ${type})`);
  }

  try {
    return callback();
  } finally {
    try {
      lockService.releaseLock();
    } catch (e) {
      console.warn('[LockService] ロック解放時に警告が発生しました:', e.message);
    }
  }
}