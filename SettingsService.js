/**
 * @file SettingsService.gs
 * @description 設定画面における管理者認証およびスクリプトプロパティの参照・更新処理を担当するファイル
 */

/**
 * 入力された管理者パスワードを検証します。
 * 全角・半角スペースを除去し、Config.gs で定義されたヘルパー関数を使用してプロパティを取得します。
 * プロパティが未設定の場合はデフォルトパスワードを採用します。
 * 
 * @param {string} inputPassword - 画面で入力されたパスワード
 * @returns {Object} 検証結果オブジェクト { success: boolean, message: string }
 */
function verifyAdminPassword(inputPassword) {
  try {
    if (inputPassword === undefined || inputPassword === null) {
      return { success: false, message: "⚠️ パスワードを入力してください。" };
    }

    // 半角・全角スペースを完全に除去
    const cleanedInput = String(inputPassword).replace(/[\s\u3000]+/g, '');

    if (cleanedInput === '') {
      return { success: false, message: "⚠️ パスワードを入力してください。" };
    }

    let storedPassword = '';
    try {
      // Config.gs のヘルパー関数を経由してプロパティを取得（存在しない場合は SharedLib がエラーをスロー）
      storedPassword = getScriptProperty_(CONFIG.PROPERTY_KEYS.ADMIN_PASSWORD);
    } catch (e) {
      // プロパティが存在しない場合はデフォルト値を設定
      storedPassword = CONFIG.DEFAULTS.ADMIN_PASSWORD;
    }

    // 取得したパスワード（またはデフォルト値）からもスペースを除去して正規化
    const activePassword = String(storedPassword).replace(/[\s\u3000]+/g, '');

    if (cleanedInput === activePassword) {
      return { success: true, message: "認証に成功しました。" };
    } else {
      return { success: false, message: "⚠️ パスワードが正しくありません。" };
    }
  } catch (error) {
    return { success: false, message: "⚠️ 認証処理中にエラーが発生しました: " + error.toString() };
  }
}

/**
 * 現在設定されている各種スクリプトプロパティ（スプレッドシートID、通知先メールアドレス）の値を取得します。
 * 
 * @returns {Object} プロパティ値オブジェクト { spreadsheetId: string, notificationEmail: string }
 */
function getScriptPropertiesData() {
  try {
    let spreadsheetId = '';
    let notificationEmail = '';

    try {
      spreadsheetId = getScriptProperty_(CONFIG.PROPERTY_KEYS.SPREADSHEET_ID);
    } catch (e) {
      spreadsheetId = '';
    }

    try {
      notificationEmail = getScriptProperty_(CONFIG.PROPERTY_KEYS.NOTIFICATION_EMAIL);
    } catch (e) {
      notificationEmail = '';
    }

    return {
      spreadsheetId: spreadsheetId,
      notificationEmail: notificationEmail
    };
  } catch (error) {
    return {
      spreadsheetId: '',
      notificationEmail: ''
    };
  }
}

/**
 * 入力された設定値（スプレッドシートID、通知先メールアドレス、新パスワード）をスクリプトプロパティへ保存します。
 * 新しいパスワードは全角・半角スペースを除去した上で保存されます。
 * 
 * @param {Object} settingsData - 保存対象の設定データ
 * @param {string} settingsData.spreadsheetId - スプレッドシートID
 * @param {string} settingsData.notificationEmail - 通知先メールアドレス
 * @param {string} [settingsData.newPassword] - 新しいパスワード（任意）
 * @returns {Object} 保存結果オブジェクト { success: boolean, message: string }
 */
function saveScriptPropertiesData(settingsData) {
  try {
    if (!settingsData) {
      return { success: false, message: "⚠️ 保存データが無効です。" };
    }

    const scriptProperties = PropertiesService.getScriptProperties();

    if (settingsData.spreadsheetId !== undefined) {
      scriptProperties.setProperty(CONFIG.PROPERTY_KEYS.SPREADSHEET_ID, String(settingsData.spreadsheetId).trim());
    }

    if (settingsData.notificationEmail !== undefined) {
      scriptProperties.setProperty(CONFIG.PROPERTY_KEYS.NOTIFICATION_EMAIL, String(settingsData.notificationEmail).trim());
    }

    // 新しいパスワードが入力されている場合のみ更新（全角・半角スペースを除去）
    if (settingsData.newPassword) {
      const cleanedNewPassword = String(settingsData.newPassword).replace(/[\s\u3000]+/g, '');
      if (cleanedNewPassword !== '') {
         scriptProperties.setProperty(CONFIG.PROPERTY_KEYS.ADMIN_PASSWORD, cleanedNewPassword);
      }
    }

    return { success: true, message: "✅ 設定を保存しました。" };
  } catch (error) {
    return { success: false, message: "⚠️ 設定保存処理中にエラーが発生しました: " + error.toString() };
  }
}