/**
 * @file Config.gs
 * @description 共通ライブラリ全体で使用するシステム定数および設定値を一元管理します。（業務ドメイン非依存）
 */

/**
 * 共通ライブラリ用設定定数
 * @type {Object}
 */
const SHARED_CONFIG = Object.freeze({
  // システム汎用設定
  HOLIDAY_CALENDAR_ID: 'ja.japanese#holiday@group.v.calendar.google.com',

  // キャッシュ設定 (単位: 秒 / 6時間 = 21600秒)
  CACHE_EXPIRATION_SEC: 21600,
  CACHE_KEYS: {
    HOLIDAYS_MAP: 'SHARED_LIB_HOLIDAYS_MAP',
    HOLIDAYS_LIST: 'SHARED_LIB_HOLIDAYS_LIST'
  },

  // 排他制御（ロック）既定値
  LOCK_DEFAULTS: {
    TIMEOUT_MS: 10000,
    RETRIES: 2,
    RETRY_INTERVAL_MS: 1000
  },

  // PDF出力既定パラメーター
  PDF_DEFAULTS: {
    SIZE: 'A4',
    PORTRAIT: true,
    FIT_TO_PAGE: true,
    GRIDLINES: false
  },

  // トリガー制御既定値
  TRIGGER_DEFAULTS: {
    DEFAULT_DELAY_MINUTES: 5
  }
});