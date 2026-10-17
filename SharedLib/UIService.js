/**
 * @file UIService.gs
 * @description フロントエンドUIコンポーネントを呼び出し元プロジェクトへ提供します。
 */

/**
 * ログイン画面のHTMLコンポーネントを取得します。
 * @return {string} ログイン画面のHTML文字列
 */
function getLoginUI() {
  return HtmlService.createHtmlOutputFromFile('LoginUI').getContent();
}

/**
 * フロントエンド共通UIコンポーネントを取得します。
 * @return {string} 共通UIコンポーネントのHTML文字列
 */
function getCommonUI() {
  return HtmlService.createHtmlOutputFromFile('CommonUI').getContent();
}