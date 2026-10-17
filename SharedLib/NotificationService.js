/**
 * @file NotificationService.gs
 * @description Slack、Microsoft Teams、および Google Chat への Webhook 通知機能を提供します。
 */

/**
 * Incoming Webhook を使用して Slack へ通知を送信します。
 *
 * @param {string} webhookUrl Slack Webhook URL
 * @param {string} message 送信メッセージテキスト
 * @param {Object} [options={}] 通知カスタマイズオプション（username, icon_emoji等）
 */
function sendSlackNotification(webhookUrl, message, options = {}) {
  if (!webhookUrl) throw new Error('エラー：Slack Webhook URLが指定されていません。');
  const payload = Object.assign({ text: message }, options);
  const fetchOptions = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(webhookUrl, fetchOptions);
  if (response.getResponseCode() !== 200) {
    throw new Error(`Slack通知の送信に失敗しました: ${response.getContentText()}`);
  }
}

/**
 * Incoming Webhook を使用して Microsoft Teams へ通知（MessageCard形式）を送信します。
 *
 * @param {string} webhookUrl Teams Webhook URL
 * @param {string} title 通知タイトル
 * @param {string} message 送信メッセージテキスト（Markdown対応）
 */
function sendTeamsNotification(webhookUrl, title, message) {
  if (!webhookUrl) throw new Error('エラー：Teams Webhook URLが指定されていません。');
  const payload = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    'summary': title,
    'themeColor': '0076D7',
    'title': title,
    'text': message
  };
  const fetchOptions = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(webhookUrl, fetchOptions);
  if (response.getResponseCode() !== 200) {
    throw new Error(`Teams通知の送信に失敗しました: ${response.getContentText()}`);
  }
}

/**
 * Incoming Webhook を使用して Google Chat へ通知を送信します。
 *
 * @param {string} webhookUrl Google Chat Webhook URL
 * @param {string} message 送信メッセージテキスト
 * @param {Object} [options={}] 通知カスタマイズオプション
 * @param {string} [options.threadKey] スレッドをグループ化するための識別キー
 */
function sendGoogleChatNotification(webhookUrl, message, options = {}) {
  if (!webhookUrl) throw new Error('エラー：Google Chat Webhook URLが指定されていません。');

  let targetUrl = webhookUrl;
  // threadKeyが指定されている場合、同じスレッドに返信をまとめるためのクエリパラメータを付与
  if (options && options.threadKey) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl += `${separator}threadKey=${encodeURIComponent(options.threadKey)}`;
  }

  const payload = { text: message };
  const fetchOptions = {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(targetUrl, fetchOptions);
  if (response.getResponseCode() !== 200) {
    throw new Error(`Google Chat通知の送信に失敗しました: ${response.getContentText()}`);
  }
}

/**
 * システムエラー発生時のフォーマットメッセージを外部チャットへ一括通知します。
 * Webhook URLが未設定の場合は例外を発生させず、警告ログを出力して送信をスキップします。
 *
 * @param {string} webhookUrl 通知先 Webhook URL
 * @param {string} context エラーが発生した文脈・関数名
 * @param {Error|string} error エラーオブジェクトまたはメッセージ
 * @param {'slack'|'teams'|'googlechat'} [type='slack'] 通知先サービス種別
 * @param {Object} [options={}] 各通知サービス向けの追加オプション
 */
function notifyError(webhookUrl, context, error, type = 'slack', options = {}) {
  // URL未設定時は安全にスキップ
  if (!webhookUrl) {
    console.warn(`[NotificationService] Webhook URLが指定されていないため、エラー通知をスキップしました。(Context: ${context})`);
    return;
  }

  const msg = error instanceof Error ? error.message : String(error);
  const formattedText = `⚠️ *[GAS System Error]*\n*Context:* ${context}\n*Message:* ${msg}\n*Time:* ${new Date().toLocaleString('ja-JP')}`;
  const serviceType = String(type).toLowerCase();

  try {
    if (serviceType === 'teams') {
      sendTeamsNotification(webhookUrl, `System Error in ${context}`, formattedText);
    } else if (serviceType === 'googlechat' || serviceType === 'chat') {
      sendGoogleChatNotification(webhookUrl, formattedText, options);
    } else {
      sendSlackNotification(webhookUrl, formattedText, options);
    }
  } catch (e) {
    console.error(`[NotificationService] エラー通知の送信中にエラーが発生しました: ${e.message}`);
  }
}