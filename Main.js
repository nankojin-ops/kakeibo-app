/**
 * @file Main.gs
 * @description エントリーポイント（doGetおよびWebフロントからのエンドポイント）を担当するファイル
 */

/**
 * Webアプリにアクセスした際にHTML画面を生成して返す関数
 * 
 * @returns {GoogleAppsScript.HTML.HtmlOutput} レンダリングされたHTML出力オブジェクト
 */
function doGet() {
  const categories = getCategoriesFromSheet();

  const template = HtmlService.createTemplateFromFile("Index");
  template.categories = categories;
  
  return template.evaluate()
    .setTitle("家計簿アプリ")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/**
 * Webフロントエンドから呼び出されるデータ保存用のラッパー関数
 * 
 * @param {Object} formData - フォーム入力データ
 * @returns {Object} 実行結果オブジェクト { success: boolean, message: string }
 */
function saveBalanceFromWeb(formData) {
  try {
    const result = saveBalanceToSheet(formData);
    if (!result) {
      return { success: false, message: "⚠️ データの保存処理から応答がありませんでした。" };
    }
    return result;
  } catch (error) {
    return { success: false, message: "⚠️ サーバー処理エラー: " + (error.message || error.toString()) };
  }
}

/**
 * Webフロントエンドから呼び出される月別データ取得用のラッパー関数
 * 
 * @param {string} yearMonth - 対象年月 (YYYY-MM)
 * @returns {Object} 処理結果オブジェクト { success: boolean, data?: Object, message?: string }
 */
function getMonthlySummaryFromWeb(yearMonth) {
  try {
    const result = getMonthlySummary(yearMonth);
    if (!result) {
      return { success: false, message: "⚠️ 集計処理から応答がありませんでした。" };
    }
    return result;
  } catch (error) {
    return { success: false, message: "⚠️ サーバー処理エラー: " + (error.message || error.toString()) };
  }
}

/**
 * Webフロントエンドから呼び出される管理者パスワード検証関数
 * 
 * @param {string} password - 入力パスワード
 * @returns {Object} 検証結果オブジェクト { success: boolean, message: string }
 */
function verifyAdminPasswordFromWeb(password) {
  try {
    const result = verifyAdminPassword(password);
    if (!result) {
      return { success: false, message: "⚠️ パスワード検証から応答がありませんでした。" };
    }
    return result;
  } catch (error) {
    return { success: false, message: "⚠️ 認証処理エラー: " + (error.message || error.toString()) };
  }
}

/**
 * Webフロントエンドから呼び出されるスクリプトプロパティ取得関数
 * 
 * @returns {Object} プロパティオブジェクト { spreadsheetId: string, notificationEmail: string }
 */
function getScriptPropertiesFromWeb() {
  try {
    return getScriptPropertiesData();
  } catch (error) {
    return { spreadsheetId: "", notificationEmail: "" };
  }
}

/**
 * Webフロントエンドから呼び出されるスクリプトプロパティ保存関数
 * 
 * @param {Object} settingsData - 保存用設定オブジェクト
 * @returns {Object} 処理結果オブジェクト { success: boolean, message: string }
 */
function saveScriptPropertiesFromWeb(settingsData) {
  try {
    const result = saveScriptPropertiesData(settingsData);
    if (!result) {
      return { success: false, message: "⚠️ 設定保存から応答がありませんでした。" };
    }
    return result;
  } catch (error) {
    return { success: false, message: "⚠️ 設定保存エラー: " + (error.message || error.toString()) };
  }
}

/**
 * Webフロントエンドから呼び出されるカテゴリ管理データ取得用のラッパー関数
 * 
 * @returns {Object} 処理結果オブジェクト { success: boolean, rawCategories: string[], sortedCategories: string[], counts: Object.<string, number>, message?: string }
 */
function getCategoryManagementDataFromWeb() {
  try {
    const result = getCategoryManagementData();
    if (!result) {
      return {
        success: false,
        message: "⚠️ カテゴリ管理データの取得から応答がありませんでした。",
        rawCategories: [],
        sortedCategories: [],
        counts: {}
      };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: "⚠️ サーバー処理エラー: " + (error.message || error.toString()),
      rawCategories: [],
      sortedCategories: [],
      counts: {}
    };
  }
}

/**
 * Webフロントエンドから呼び出されるカテゴリ保存用のラッパー関数
 * 
 * @param {string[]} categories - マスターカテゴリ名配列（定義順）
 * @returns {Object} 処理結果オブジェクト { success: boolean, message: string, rawCategories?: string[], sortedCategories?: string[], counts?: Object.<string, number> }
 */
function saveCategoriesFromWeb(categories) {
  try {
    const result = saveCategoriesToSheet(categories);
    if (!result) {
      return { success: false, message: "⚠️ カテゴリの保存処理から応答がありませんでした。" };
    }
    return result;
  } catch (error) {
    return { success: false, message: "⚠️ サーバー処理エラー: " + (error.message || error.toString()) };
  }
}