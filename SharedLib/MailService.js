/**
 * @file MailService.gs
 * @description テンプレート文字列の置換処理および安全なメール送信機能を提供します。
 */

/**
 * テンプレート文字列内の変数（例: {{name}}）を指定されたオブジェクトの値で置換してメールを送信します。
 *
 * @param {Object} options メール送信オプション
 * @param {string} options.to 宛先メールアドレス
 * @param {string} options.subject 件名テンプレート
 * @param {string} options.bodyTemplate 本文プレーンテキストテンプレート
 * @param {Object} [options.templateData={}] テンプレート置換データオブジェクト
 * @param {string} [options.htmlBodyTemplate] HTML本文テンプレート
 * @param {string} [options.cc] CCアドレス
 * @param {string} [options.bcc] BCCアドレス
 * @param {GoogleAppsScript.Base.BlobSource[]} [options.attachments] 添付ファイル配列
 */
function sendTemplateMail(options) {
  if (!options || !options.to || !options.subject || !options.bodyTemplate) {
    throw new Error('エラー：メール送信に必要な必須パラメーター（to, subject, bodyTemplate）が不足しています。');
  }

  const data = options.templateData || {};

  // テンプレート置換関数
  const render = (template) => {
    if (!template) return '';
    return template.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  };

  const finalSubject = render(options.subject);
  const finalBody = render(options.bodyTemplate);
  const mailConfig = {
    to: options.to,
    subject: finalSubject,
    body: finalBody
  };

  if (options.htmlBodyTemplate) {
    mailConfig.htmlBody = render(options.htmlBodyTemplate);
  }
  if (options.cc) mailConfig.cc = options.cc;
  if (options.bcc) mailConfig.bcc = options.bcc;
  if (options.attachments) mailConfig.attachments = options.attachments;

  const remainingQuota = MailApp.getRemainingDailyQuota();
  if (remainingQuota <= 0) {
    throw new Error('エラー：本日のメール送信上限（Quota）に達しているため送信できません。');
  }

  MailApp.sendEmail(mailConfig);
}

/**
 * 当日の残りメール送信可能件数を取得します。
 * @return {number} 残り送信枠数
 */
function getRemainingMailQuota() {
  return MailApp.getRemainingDailyQuota();
}