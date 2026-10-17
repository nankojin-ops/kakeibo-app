/**
 * @file SpreadsheetService.gs
 * @description Google スプレッドシートに関する読み書きおよび集計処理を担当するファイル
 */

/**
 * 設定されたスプレッドシートオブジェクトを取得する
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} スプレッドシートオブジェクト
 */
function getTargetSpreadsheet() {
  const spreadsheetId = getScriptProperty_(CONFIG.PROPERTY_KEYS.SPREADSHEET_ID);
  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * 「入力」シートの入力規則からマスター定義順のカテゴリ一覧を取得する
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} [optSs] - スプレッドシートオブジェクト（省略時は自動取得）
 * @returns {string[]} マスター定義順のカテゴリ名配列
 */
function getRawCategoriesFromSheet(optSs) {
  try {
    const ss = optSs || getTargetSpreadsheet();
    const inputSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INPUT);

    if (inputSheet) {
      const validation = inputSheet.getRange(CONFIG.RANGES.CATEGORY_VALIDATION).getDataValidation();
      if (validation) {
        const rule = validation.getCriteriaType();
        let rawList = [];
        if (rule === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
          rawList = validation.getCriteriaValues()[0] || [];
        } else if (rule === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
          const range = validation.getCriteriaValues()[0];
          if (range) {
            rawList = range.getValues().flat();
          }
        }

        const cleaned = [];
        const seen = new Set();
        rawList.forEach(v => {
          const str = String(v ?? "").trim();
          if (str !== "" && !seen.has(str)) {
            seen.add(str);
            cleaned.push(str);
          }
        });

        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }
  } catch (e) {
    console.warn("カテゴリ取得失敗。デフォルト値を使用します。エラー: " + e.toString());
  }
  return CONFIG.DEFAULT_CATEGORIES.slice();
}

/**
 * 「履歴」シートのカテゴリ列から各カテゴリの出現回数（登録件数）を集計する
 * SharedLib.getHeaderMap を利用して「カテゴリ」列の位置を動的に特定（デフォルト3列目）します。
 * 
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} [optSs] - スプレッドシートオブジェクト（省略時は自動取得）
 * @returns {Object.<string, number>} カテゴリ名ごとの登録件数マップ
 */
function getCategoryCountsFromSheet(optSs) {
  const counts = {};
  try {
    const ss = optSs || getTargetSpreadsheet();
    const historySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HISTORY);
    if (!historySheet) {
      return counts;
    }

    const lastRow = historySheet.getLastRow();
    if (lastRow < 2) {
      return counts;
    }

    const headerMap = SharedLib.getHeaderMap(historySheet, 1);
    const categoryColIndex = headerMap["カテゴリ"] || 3;

    const values = historySheet.getRange(2, categoryColIndex, lastRow - 1, 1).getValues();
    for (let i = 0; i < values.length; i++) {
      const cat = String(values[i][0] ?? "").trim();
      if (cat !== "") {
        const current = (Object.prototype.hasOwnProperty.call(counts, cat) && typeof counts[cat] === "number")
          ? counts[cat]
          : 0;
        counts[cat] = current + 1;
      }
    }
  } catch (e) {
    console.warn("カテゴリ件数集計失敗。エラー: " + e.toString());
  }
  return counts;
}

/**
 * マスターカテゴリ配列を登録件数の降順（同数の場合はマスター定義順）に安定ソートする
 * @param {string[]} rawCategories - マスター定義順のカテゴリ配列
 * @param {Object.<string, number>} countsMap - カテゴリ名ごとの登録件数マップ
 * @returns {string[]} ソート済みカテゴリ配列
 */
function sortCategoriesByCount(rawCategories, countsMap) {
  if (!Array.isArray(rawCategories)) {
    return CONFIG.DEFAULT_CATEGORIES.slice();
  }
  const map = countsMap || {};
  const getCount = (key) => (Object.prototype.hasOwnProperty.call(map, key) && typeof map[key] === "number") ? map[key] : 0;
  return rawCategories.slice().sort((a, b) => getCount(b) - getCount(a));
}

/**
 * 「入力」シートの入力規則と「履歴」シートの登録件数に基づき、登録数降順のカテゴリ一覧を取得する
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} [optSs] - スプレッドシートオブジェクト（省略時は自動取得）
 * @returns {string[]} 登録件数降順（同数は定義順）のカテゴリ名配列
 */
function getCategoriesFromSheet(optSs) {
  try {
    const ss = optSs || getTargetSpreadsheet();
    const rawCategories = getRawCategoriesFromSheet(ss);
    const countsMap = getCategoryCountsFromSheet(ss);
    return sortCategoriesByCount(rawCategories, countsMap);
  } catch (e) {
    console.warn("ソート済みカテゴリ取得失敗。デフォルト値を使用します。エラー: " + e.toString());
    return CONFIG.DEFAULT_CATEGORIES.slice();
  }
}

/**
 * カテゴリメンテナンス画面用にマスターカテゴリ配列・ソート済み配列・登録件数マップを一括取得する
 * @returns {{ success: boolean, rawCategories: string[], sortedCategories: string[], counts: Object.<string, number>, message?: string }}
 */
function getCategoryManagementData() {
  try {
    const ss = getTargetSpreadsheet();
    const rawCategories = getRawCategoriesFromSheet(ss);
    const counts = getCategoryCountsFromSheet(ss);
    const sortedCategories = sortCategoriesByCount(rawCategories, counts);
    return {
      success: true,
      rawCategories: rawCategories,
      sortedCategories: sortedCategories,
      counts: counts
    };
  } catch (e) {
    const fallback = CONFIG.DEFAULT_CATEGORIES.slice();
    return {
      success: false,
      rawCategories: fallback,
      sortedCategories: fallback.slice(),
      counts: {},
      message: "⚠️ カテゴリ情報の取得に失敗しました: " + (e.message || e.toString())
    };
  }
}

/**
 * カテゴリ一覧を検証し、SharedLib.withLock の排他制御下で「入力」シート B3 セルのデータ入力規則（VALUE_IN_LIST）へ保存する
 * @param {string[]} categories - 保存するマスターカテゴリ配列（定義順）
 * @returns {{ success: boolean, message: string, rawCategories?: string[], sortedCategories?: string[], counts?: Object.<string, number> }}
 */
function saveCategoriesToSheet(categories) {
  if (!Array.isArray(categories)) {
    return { success: false, message: "⚠️ カテゴリデータの形式が不正です。" };
  }

  if (categories.length === 0) {
    return { success: false, message: "⚠️ カテゴリは最低1件以上登録してください。" };
  }

  const cleanedCategories = [];
  const seen = new Set();

  for (let i = 0; i < categories.length; i++) {
    const item = categories[i];
    if (item === null || item === undefined) {
      return { success: false, message: "⚠️ 空のカテゴリ名は登録できません。" };
    }
    const trimmed = String(item).trim();
    if (trimmed === "") {
      return { success: false, message: "⚠️ 空のカテゴリ名は登録できません。" };
    }
    if (seen.has(trimmed)) {
      return { success: false, message: `⚠️ 重複するカテゴリ名があります: ${trimmed}` };
    }
    seen.add(trimmed);
    cleanedCategories.push(trimmed);
  }

  if (cleanedCategories.length === 0) {
    return { success: false, message: "⚠️ カテゴリは最低1件以上登録してください。" };
  }

  try {
    return SharedLib.withLock(() => {
      const ss = getTargetSpreadsheet();
      const inputSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INPUT);
      if (!inputSheet) {
        return { success: false, message: `⚠️ 「${CONFIG.SHEET_NAMES.INPUT}」シートが見つかりません。スプレッドシートの設定を確認してください。` };
      }

      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(cleanedCategories, true)
        .build();
      inputSheet.getRange(CONFIG.RANGES.CATEGORY_VALIDATION).setDataValidation(rule);

      const counts = getCategoryCountsFromSheet(ss);
      const sortedCategories = sortCategoriesByCount(cleanedCategories, counts);

      return {
        success: true,
        message: "✅ カテゴリを保存しました！",
        rawCategories: cleanedCategories,
        sortedCategories: sortedCategories,
        counts: counts
      };
    }, { type: 'script', timeoutMs: CONFIG.LOCK_TIMEOUT_MS });
  } catch (error) {
    const errMsg = error.message || error.toString();
    if (errMsg.includes('[LockService]')) {
      return { success: false, message: "⚠️ 混み合っています。少し時間を置いて再度お試しください。" };
    }
    return { success: false, message: "⚠️ カテゴリ保存中にエラーが発生しました: " + errMsg };
  }
}

/**
 * 「履歴」シートに収支レコードを追加する（SharedLib.withLock および SharedLib.isNumeric を活用）
 * @param {Object} formData - 入力フォームデータ
 * @param {string} formData.type - 収支区分 ("収入" | "支出")
 * @param {string|number} formData.amount - 金額
 * @param {string} [formData.category] - カテゴリ
 * @param {string} [formData.memo] - メモ
 * @param {string} [formData.date] - 日付文字列 (YYYY-MM-DD)
 * @returns {Object} 処理結果オブジェクト { success: boolean, message: string, sortedCategories?: string[], counts?: Object.<string, number> }
 */
function saveBalanceToSheet(formData) {
  try {
    const type = formData.type;
    const category = formData.category || "";
    const memo = formData.memo || "";
    const finalDate = formData.date ? new Date(formData.date) : new Date();

    if (!type) return { success: false, message: "⚠️ 収支区分を選択してください。" };
    if (!category) return { success: false, message: "⚠️ カテゴリを選択してください。" };
    if (!SharedLib.isNumeric(formData.amount) || Number(formData.amount) === 0) {
      return { success: false, message: "⚠️ 金額を正しく入力してください。" };
    }

    let amount = Number(formData.amount);
    if (type === "支出" && amount > 0) {
      amount = -amount;
    }

    return SharedLib.withLock(() => {
      const ss = getTargetSpreadsheet();
      const historySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HISTORY);
      if (!historySheet) {
        return { success: false, message: `⚠️ 「${CONFIG.SHEET_NAMES.HISTORY}」シートが見つかりません。` };
      }

      historySheet.appendRow([finalDate, type, category, amount, memo]);
      const rawCategories = getRawCategoriesFromSheet(ss);
      const counts = getCategoryCountsFromSheet(ss);
      const sortedCategories = sortCategoriesByCount(rawCategories, counts);
      return {
        success: true,
        message: "✅ 記録完了しました！",
        sortedCategories: sortedCategories,
        counts: counts
      };
    }, { type: 'script', timeoutMs: CONFIG.LOCK_TIMEOUT_MS });
  } catch (error) {
    const errMsg = error.message || error.toString();
    if (errMsg.includes('[LockService]')) {
      return { success: false, message: "⚠️ 混み合っています。少し時間を置いて再度お試しください。" };
    }
    return { success: false, message: "⚠️ エラーが発生しました: " + errMsg };
  }
}

/**
 * 指定された年月におけるすべての明細レコードを「履歴」シートから取得する
 * （フロントエンドでのリアルタイムフィルタリング用）
 * 
 * @param {string} yearMonth - 対象年月 (形式: "YYYY-MM")
 * @returns {Object} 処理結果オブジェクト { success: boolean, data?: Object, message?: string }
 */
function getMonthlySummary(yearMonth) {
  try {
    const ss = getTargetSpreadsheet();
    const historySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HISTORY);
    if (!historySheet) {
      return { success: false, message: `⚠️ 「${CONFIG.SHEET_NAMES.HISTORY}」シートが見つかりません。` };
    }

    const rows = SharedLib.sheetToObjects(historySheet, 1);
    const rawDetails = [];

    rows.forEach(row => {
      const rawDate = row["日付"];
      if (!rawDate) return;

      const dateObj = new Date(rawDate);
      if (isNaN(dateObj.getTime())) return;

      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const rowYearMonth = `${yyyy}-${mm}`;

      if (rowYearMonth !== yearMonth) return;

      const type = String(row["区分"] || row["収支区分"] || "");
      const category = String(row["カテゴリ"] || "未分類");
      const amount = Number(row["金額"]) || 0;
      const memo = String(row["メモ"] || "");

      rawDetails.push({
        dateObj: dateObj,
        date: formatDate(dateObj),
        type: type,
        category: category,
        amount: amount,
        memo: memo
      });
    });

    // 日付昇順（古い日付順）にソート
    rawDetails.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    const details = rawDetails.map(item => ({
      date: item.date,
      type: item.type,
      category: item.category,
      amount: item.amount,
      memo: item.memo
    }));

    return {
      success: true,
      data: {
        yearMonth: String(yearMonth),
        details: details
      }
    };
  } catch (error) {
    return { success: false, message: "⚠️ データ取得中にエラーが発生しました: " + error.toString() };
  }
}