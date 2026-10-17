/**
 * @file SpreadsheetService.gs
 * @description スプレッドシートに対する汎用データ変換、検索、および自動排他制御を伴う安全な入出力機能を提供します。
 */

/**
 * シートの指定行をヘッダーとして、データをオブジェクト配列に変換して取得します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 対象のシートオブジェクト
 * @param {number} [headerRowIndex=1] ヘッダー行番号（1始まり）
 * @return {Array<Object>} 行データを格納したオブジェクトの配列
 */
function sheetToObjects(sheet, headerRowIndex = 1) {
  if (!sheet) throw new Error('エラー：有効なSheetオブジェクトが渡されていません。');
  const data = sheet.getDataRange().getValues();
  if (data.length < headerRowIndex) return [];

  const headers = data[headerRowIndex - 1].map(h => String(h).trim());
  const result = [];

  for (let i = headerRowIndex; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    let hasValue = false;

    headers.forEach((header, colIdx) => {
      if (header !== '') {
        const val = row[colIdx];
        obj[header] = val;
        if (val !== '' && val !== null && val !== undefined) {
          hasValue = true;
        }
      }
    });

    if (hasValue) {
      result.push(obj);
    }
  }
  return result;
}

/**
 * オブジェクト配列を指定したヘッダー順に従ってシートへ一括書き込みします。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 対象のシートオブジェクト
 * @param {Array<Object>} objects 書き込むオブジェクトの配列
 * @param {string[]} headers 書き込み対象のヘッダー配列
 * @param {number} [startRowIndex=2] 書き込み開始行番号（1始まり）
 * @param {boolean} [clearExisting=false] 書き込み前に対象範囲の既存データをクリアするか
 */
function objectsToSheet(sheet, objects, headers, startRowIndex = 2, clearExisting = false) {
  if (!sheet) throw new Error('エラー：有効なSheetオブジェクトが渡されていません。');
  if (!headers || headers.length === 0) throw new Error('エラー：ヘッダー配列が指定されていません。');

  if (clearExisting) {
    const lastRow = sheet.getLastRow();
    if (lastRow >= startRowIndex) {
      sheet.getRange(startRowIndex, 1, lastRow - startRowIndex + 1, headers.length).clearContent();
    }
  }

  if (!objects || objects.length === 0) return;

  const rows = objects.map(obj => {
    return headers.map(header => {
      const val = obj[header];
      return val !== undefined ? val : '';
    });
  });

  sheet.getRange(startRowIndex, 1, rows.length, headers.length).setValues(rows);
}

/**
 * 数式や空文字（""）を除外した「実際にデータが存在する正確な最終行と最終列」を取得します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 対象のシートオブジェクト
 * @return {{lastRow: number, lastColumn: number}} 最終行番号および最終列番号
 */
function getLastRowAndColumn(sheet) {
  if (!sheet) throw new Error('エラー：有効なSheetオブジェクトが渡されていません。');
  const data = sheet.getDataRange().getValues();
  let lastRow = 0;
  let lastColumn = 0;

  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const val = data[r][c];
      if (val !== '' && val !== null && val !== undefined) {
        if (r + 1 > lastRow) lastRow = r + 1;
        if (c + 1 > lastColumn) lastColumn = c + 1;
      }
    }
  }
  return { lastRow, lastColumn };
}

/**
 * ヘッダー行を解析し、ヘッダー名と1始まりの列番号のマッピングを取得します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 対象のシートオブジェクト
 * @param {number} [headerRowIndex=1] ヘッダー行番号（1始まり）
 * @return {Object<string, number>} ヘッダー名をキー、列番号（1始まり）を値とするオブジェクト
 */
function getHeaderMap(sheet, headerRowIndex = 1) {
  if (!sheet) throw new Error('エラー：有効なSheetオブジェクトが渡されていません。');
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};

  const headers = sheet.getRange(headerRowIndex, 1, 1, lastCol).getValues()[0];
  const headerMap = {};

  headers.forEach((h, idx) => {
    const key = String(h).trim();
    if (key !== '') {
      headerMap[key] = idx + 1;
    }
  });
  return headerMap;
}

/**
 * スプレッドシートから指定された名前のシートを取得します。存在しない場合は新規作成し、ヘッダーを配置します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet スプレッドシートオブジェクト
 * @param {string} sheetName シート名
 * @param {string[]} [headers=[]] シート新規作成時に配置するヘッダー配列
 * @return {GoogleAppsScript.Spreadsheet.Sheet} 対象のシートオブジェクト
 */
function getOrCreateSheet(spreadsheet, sheetName, headers = []) {
  if (!spreadsheet) throw new Error('エラー：有効なSpreadsheetオブジェクトが渡されていません。');
  if (!sheetName) throw new Error('エラー：シート名が指定されていません。');

  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  return sheet;
}

/**
 * TextFinderを利用し、指定されたキー列から特定の値を完全一致で高速検索します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 対象のシートオブジェクト
 * @param {string} keyHeaderName 検索キーとなるヘッダー列名
 * @param {*} keyValue 検索する値
 * @param {number} [headerRowIndex=1] ヘッダー行番号（1始まり）
 * @return {{rowIndex: number, rowData: Object}|null} 見つかった場合は行番号と行データ、見つからない場合は null
 */
function findRowByKey(sheet, keyHeaderName, keyValue, headerRowIndex = 1) {
  if (!sheet) throw new Error('エラー：有効なSheetオブジェクトが渡されていません。');
  const headerMap = getHeaderMap(sheet, headerRowIndex);
  const colIndex = headerMap[keyHeaderName];

  if (!colIndex) {
    throw new Error(`エラー：ヘッダー「${keyHeaderName}」がシートに見つかりません。`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= headerRowIndex) return null;

  const searchRange = sheet.getRange(headerRowIndex + 1, colIndex, lastRow - headerRowIndex, 1);
  const finder = searchRange.createTextFinder(String(keyValue)).matchEntireCell(true);
  const resultCell = finder.findNext();

  if (!resultCell) return null;

  const rowIndex = resultCell.getRow();
  const rowValues = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = {};

  Object.keys(headerMap).forEach(header => {
    const cIdx = headerMap[header];
    rowData[header] = rowValues[cIdx - 1];
  });

  return { rowIndex, rowData };
}

/**
 * 自動排他制御（LockService）を伴い、オブジェクト形式のデータを最終行へ安全に追記します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 対象のシートオブジェクト
 * @param {Object} rowObject 追記するデータオブジェクト
 * @param {Object} [lockOptions={}] ロック制御オプション（LockService.gs に準拠）
 * @param {number} [headerRowIndex=1] ヘッダー行番号（1始まり）
 * @return {number} 追記された行番号
 */
function appendRowFromObject(sheet, rowObject, lockOptions = {}, headerRowIndex = 1) {
  if (!sheet) throw new Error('エラー：有効なSheetオブジェクトが渡されていません。');
  if (!rowObject || typeof rowObject !== 'object') throw new Error('エラー：有効なデータオブジェクトが渡されていません。');

  return withLock(() => {
    const headerMap = getHeaderMap(sheet, headerRowIndex);
    const headers = Object.keys(headerMap);

    if (headers.length === 0) {
      throw new Error('エラー：シートに有効なヘッダーが存在しません。');
    }

    const maxCol = Math.max(...Object.values(headerMap));
    const newRow = new Array(maxCol).fill('');

    headers.forEach(header => {
      const colIdx = headerMap[header];
      const val = rowObject[header];
      newRow[colIdx - 1] = val !== undefined ? val : '';
    });

    const targetRow = sheet.getLastRow() + 1;
    sheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);
    return targetRow;
  }, lockOptions);
}

/**
 * 自動排他制御（LockService）を伴い、特定キーで検索した単一行を指定されたオブジェクトデータで安全に更新します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 対象のシートオブジェクト
 * @param {string} keyHeaderName 検索キーとなるヘッダー列名
 * @param {*} keyValue 検索する値
 * @param {Object} updateObject 更新する項目と値を含むオブジェクト
 * @param {Object} [lockOptions={}] ロック制御オプション
 * @param {number} [headerRowIndex=1] ヘッダー行番号（1始まり）
 * @return {boolean} 更新に成功した場合は true
 * @throws {Error} 対象行が存在しない場合
 */
function updateRowByKey(sheet, keyHeaderName, keyValue, updateObject, lockOptions = {}, headerRowIndex = 1) {
  if (!sheet) throw new Error('エラー：有効なSheetオブジェクトが渡されていません。');
  if (!updateObject) throw new Error('エラー：更新データオブジェクトが指定されていません。');

  return withLock(() => {
    const hit = findRowByKey(sheet, keyHeaderName, keyValue, headerRowIndex);
    if (!hit) {
      throw new Error(`エラー：${keyHeaderName} = 「${keyValue}」 に一致するレコードが見つからないため更新できません。`);
    }

    const headerMap = getHeaderMap(sheet, headerRowIndex);
    const rowIndex = hit.rowIndex;

    Object.keys(updateObject).forEach(header => {
      const colIdx = headerMap[header];
      if (colIdx) {
        sheet.getRange(rowIndex, colIdx).setValue(updateObject[header]);
      }
    });

    return true;
  }, lockOptions);
}

/**
 * 自動排他制御（LockService）を伴い、特定キーで検索した単一行を安全に削除します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 対象のシートオブジェクト
 * @param {string} keyHeaderName 検索キーとなるヘッダー列名
 * @param {*} keyValue 検索する値
 * @param {Object} [lockOptions={}] ロック制御オプション
 * @param {number} [headerRowIndex=1] ヘッダー行番号（1始まり）
 * @return {boolean} 削除に成功した場合は true
 * @throws {Error} 対象行が存在しない場合
 */
function deleteRowByKey(sheet, keyHeaderName, keyValue, lockOptions = {}, headerRowIndex = 1) {
  if (!sheet) throw new Error('エラー：有効なSheetオブジェクトが渡されていません。');

  return withLock(() => {
    const hit = findRowByKey(sheet, keyHeaderName, keyValue, headerRowIndex);
    if (!hit) {
      throw new Error(`エラー：${keyHeaderName} = 「${keyValue}」 に一致するレコードが見つからないため削除できません。`);
    }

    sheet.deleteRow(hit.rowIndex);
    return true;
  }, lockOptions);
}