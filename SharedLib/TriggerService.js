/**
 * @file TriggerService.gs
 * @description 動的な時限トリガーの作成およびクリーンアップ機能を提供します。
 */

/**
 * 指定された分後に特定の関数を実行する時限トリガー（ClockTrigger）を作成します。
 *
 * @param {string} functionName 実行対象の関数名
 * @param {number} [minutes] 実行までの遅延時間（分）
 * @return {GoogleAppsScript.Script.Trigger} 作成されたトリガーオブジェクト
 */
function setTriggerMinutesAfter(functionName, minutes) {
  if (!functionName) {
    throw new Error('エラー：実行対象の関数名が指定されていません。');
  }
  const delay = minutes !== undefined ? minutes : SHARED_CONFIG.TRIGGER_DEFAULTS.DEFAULT_DELAY_MINUTES;
  
  return ScriptApp.newTrigger(functionName)
    .timeBased()
    .after(delay * 60 * 1000)
    .create();
}

/**
 * 指定された関数名に紐づくすべてのスクリプトトリガーを削除します。
 *
 * @param {string} functionName 削除対象の関数名
 */
function deleteTriggers(functionName) {
  if (!functionName) return;

  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}