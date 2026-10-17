/**
 * @file DriveService.gs
 * @description Google Drive フォルダ操作、ファイル複製・移動・権限設定およびスプレッドシートのPDF変換処理を提供します。
 */

/**
 * 指定されたフォルダ名を取得、存在しない場合は作成して取得します。
 *
 * @param {string} folderName 検索・作成対象のフォルダ名
 * @param {string} [parentFolderId] 親フォルダのID（省略時はルート直下）
 * @return {GoogleAppsScript.Drive.Folder} Folder オブジェクト
 */
function getOrCreateFolder(folderName, parentFolderId) {
  if (!folderName) throw new Error('エラー：フォルダ名が指定されていません。');

  let parent = parentFolderId 
    ? DriveApp.getFolderById(parentFolderId) 
    : DriveApp.getRootFolder();

  const folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(folderName);
}

/**
 * 指定したスプレッドシート（または指定シート）をPDF形式の Blob として書き出します。
 *
 * @param {string} ssId スプレッドシートID
 * @param {Object} [options={}] PDF出力オプション
 * @param {number} [options.sheetId] 単一シート出力時のシートGID
 * @param {string} [options.size='A4'] 用紙サイズ ('A4', 'LETTER'等)
 * @param {boolean} [options.portrait=true] 縦向きの場合は true、横向きは false
 * @param {boolean} [options.fitToPage=true] 1ページに収めるか
 * @param {boolean} [options.gridlines=false] 枠線を表示するか
 * @return {GoogleAppsScript.Base.Blob} 生成されたPDF Blob
 */
function exportSpreadsheetToPdf(ssId, options = {}) {
  if (!ssId) throw new Error('エラー：スプレッドシートIDが渡されていません。');

  const size = options.size || SHARED_CONFIG.PDF_DEFAULTS.SIZE;
  const portrait = options.portrait !== undefined ? options.portrait : SHARED_CONFIG.PDF_DEFAULTS.PORTRAIT;
  const fitToPage = options.fitToPage !== undefined ? options.fitToPage : SHARED_CONFIG.PDF_DEFAULTS.FIT_TO_PAGE;
  const gridlines = options.gridlines !== undefined ? options.gridlines : SHARED_CONFIG.PDF_DEFAULTS.GRIDLINES;

  let url = `https://docs.google.com/spreadsheets/d/${ssId}/export?exportFormat=pdf`
    + `&size=${size}`
    + `&portrait=${portrait}`
    + `&fitw=${fitToPage}`
    + `&gridlines=${gridlines}`
    + `&fctr=false&attachment=true`;

  if (options.sheetId !== undefined) {
    url += `&gid=${options.sheetId}`;
  }

  const response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`PDF変換処理に失敗しました: ${response.getContentText()}`);
  }

  const ss = SpreadsheetApp.openById(ssId);
  const pdfName = `${ss.getName()}.pdf`;
  return response.getBlob().setName(pdfName);
}

/**
 * 指定したファイルを指定したフォルダにコピーします。
 *
 * @param {string} fileId コピー元のファイルID
 * @param {string} destinationFolderId コピー先のフォルダID
 * @param {string} [newFileName] コピー後の新規ファイル名（省略時は元ファイル名）
 * @return {GoogleAppsScript.Drive.File} コピーされた File オブジェクト
 */
function copyFile(fileId, destinationFolderId, newFileName) {
  if (!fileId || !destinationFolderId) {
    throw new Error('エラー：ファイルIDおよび移動先フォルダIDは必須です。');
  }
  const file = DriveApp.getFileById(fileId);
  const folder = DriveApp.getFolderById(destinationFolderId);
  const name = newFileName || file.getName();
  return file.makeCopy(name, folder);
}

/**
 * 指定したファイルを移動先フォルダへ移動します。
 *
 * @param {string} fileId 対象ファイルのID
 * @param {string} destinationFolderId 移動先のフォルダID
 * @return {GoogleAppsScript.Drive.File} 移動後の File オブジェクト
 */
function moveFile(fileId, destinationFolderId) {
  if (!fileId || !destinationFolderId) {
    throw new Error('エラー：ファイルIDおよび移動先フォルダIDは必須です。');
  }
  const file = DriveApp.getFileById(fileId);
  const destinationFolder = DriveApp.getFolderById(destinationFolderId);
  
  file.moveTo(destinationFolder);
  return file;
}

/**
 * 指定したファイルに対してアクセス権限（閲覧者または編集者）を付与します。
 *
 * @param {string} fileId 対象ファイルのID
 * @param {string|string[]} emails 権限を付与するメールアドレス（またはその配列）
 * @param {'viewer'|'editor'} [role='viewer'] 付与する権限種別 ('viewer' または 'editor')
 */
function grantFilePermission(fileId, emails, role = 'viewer') {
  if (!fileId || !emails) {
    throw new Error('エラー：ファイルIDおよびアクセス権対象メールアドレスは必須です。');
  }

  const file = DriveApp.getFileById(fileId);
  const emailList = Array.isArray(emails) ? emails : [emails];
  const targetRole = String(role).toLowerCase();

  emailList.forEach(email => {
    const trimmedEmail = String(email).trim();
    if (!trimmedEmail) return;

    if (targetRole === 'editor') {
      file.addEditor(trimmedEmail);
    } else {
      file.addViewer(trimmedEmail);
    }
  });
}