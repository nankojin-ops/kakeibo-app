/**
 * @file Config.gs
 * @description アプリケーション全体で使用する設定値・定数を一元管理するファイル
 */

/**
 * アプリケーション設定オブジェクト
 * @type {Object}
 */
const CONFIG = {
  // スクリプトプロパティのキー名
  PROPERTY_KEYS: {
    SPREADSHEET_ID: "SPREADSHEET_ID",
    NOTIFICATION_EMAIL: "NOTIFICATION_EMAIL",
    ADMIN_PASSWORD: "ADMIN_PASSWORD"
  },
  // デフォルトの設定値（パスワード未設定時の初期パスワードなど）
  DEFAULTS: {
    ADMIN_PASSWORD: "admin"
  },
  // シート名設定
  SHEET_NAMES: {
    INPUT: "入力",
    HISTORY: "履歴"
  },
  // セル範囲設定
  RANGES: {
    CATEGORY_VALIDATION: "B3"
  },
  // デフォルトのカテゴリリスト
  DEFAULT_CATEGORIES: [
    "食費",
    "日用品",
    "交際費",
    "交通費",
    "水道光熱費",
    "その他"
  ],
  // ロックサービスタイムアウト（ミリ秒）
  LOCK_TIMEOUT_MS: 10000
};

/**
 * スクリプトプロパティから値を取得するヘルパー関数
 * 親プロジェクトのスクリプトプロパティストアを明示的にライブラリへ引き渡します。
 * 
 * @param {string} key - プロパティキー名
 * @returns {string} プロパティ値
 * @throws {Error} キーが存在しない、または値が空の場合のエラー
 */
function getScriptProperty_(key) {
  const store = PropertiesService.getScriptProperties();
  return SharedLib.getPropertyOrThrow(key, 'script', store);
}