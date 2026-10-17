/**
 * @file PropertyService.gs
 * @description PropertiesServiceの安全な値取得および検証機能を提供します。
 */

/**
 * スクリプトプロパティ等から指定されたキーの値を取得します。
 * 値が存在しない場合（null、undefined、または空文字列）は例外をスローします。
 *
 * @param {string} key 取得対象のプロパティキー
 * @param {'script'|'user'|'document'} [propertyType='script'] プロパティ種別（store指定時は無視されます）
 * @param {GoogleAppsScript.Properties.Properties} [store] 呼び出し元のPropertiesオブジェクト（推奨）
 * @return {string} 取得したプロパティ値
 * @throws {Error} プロパティが未設定または空文字の場合
 */
function getPropertyOrThrow(key, propertyType = 'script', store) {
  if (!key) throw new Error('エラー：プロパティキーが指定されていません。');

  let activeStore = store;
  if (!activeStore) {
    if (propertyType === 'user') {
      activeStore = PropertiesService.getUserProperties();
    } else if (propertyType === 'document') {
      activeStore = PropertiesService.getDocumentProperties();
    } else {
      activeStore = PropertiesService.getScriptProperties();
    }
  }

  const value = activeStore.getProperty(key);
  if (value === null || value === undefined || String(value).trim() === '') {
    throw new Error(`[PropertyService] 必須プロパティ「${key}」が設定されていないか空です。`);
  }
  return value;
}

/**
 * スクリプトプロパティ等から指定されたキーの値を取得します。
 * 未設定または空文字列の場合は指定されたデフォルト値を返します。
 *
 * @param {string} key 取得対象のプロパティキー
 * @param {string} [defaultValue=''] 未設定時に返すデフォルト値
 * @param {'script'|'user'|'document'} [propertyType='script'] プロパティ種別（store指定時は無視されます）
 * @param {GoogleAppsScript.Properties.Properties} [store] 呼び出し元のPropertiesオブジェクト（推奨）
 * @return {string} 取得したプロパティ値またはデフォルト値
 */
function getPropertyOrDefault(key, defaultValue = '', propertyType = 'script', store) {
  if (!key) return defaultValue;

  let activeStore = store;
  if (!activeStore) {
    if (propertyType === 'user') {
      activeStore = PropertiesService.getUserProperties();
    } else if (propertyType === 'document') {
      activeStore = PropertiesService.getDocumentProperties();
    } else {
      activeStore = PropertiesService.getScriptProperties();
    }
  }

  const value = activeStore.getProperty(key);
  if (value === null || value === undefined || String(value).trim() === '') {
    return defaultValue;
  }
  return value;
}