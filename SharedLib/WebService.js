/**
 * @file WebService.gs
 * @description Web App (doGet / doPost) 用の標準レスポンス整形機能を提供します。
 */

/**
 * Web App 用の統一フォーマット JSON レスポンス (TextOutput) を生成します。
 *
 * @param {*} data クライアントに返却するデータ
 * @param {boolean} [isSuccess=true] 処理結果フラグ
 * @param {string} [errorMessage=''] エラー発生時のメッセージ
 * @return {GoogleAppsScript.Content.TextOutput} JSON 形式の TextOutput オブジェクト
 */
function createJsonResponse(data, isSuccess = true, errorMessage = '') {
  const responsePayload = {
    success: isSuccess,
    data: data !== undefined ? data : null,
    error: isSuccess ? null : errorMessage
  };

  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}