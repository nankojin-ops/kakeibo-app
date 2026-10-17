/**
 * @file Utils.gs
 * @description 日付フォーマットやHTMLテンプレートの読み込み等の汎用ユーティリティ関数群
 */

/**
 * 指定したHTMLファイルをインクルードするためのヘルパー関数
 * @param {string} filename - インクルードするファイル名（拡張子なし）
 * @returns {string} 読み込んだHTMLコンテンツ
 */
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).getRawContent();
}

/**
 * 日付オブジェクトを YYYY/MM/DD 形式の文字列にフォーマットする関数
 * @param {Date} date - フォーマット対象の日付
 * @returns {string} フォーマット後の日付文字列
 */
function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  return `${yyyy}/${mm}/${dd}`;
}