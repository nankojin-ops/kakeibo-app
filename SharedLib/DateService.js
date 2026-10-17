/**
 * @file DateService.gs
 * @description 土日祝日を考慮した営業日計算、および汎用的な日付操作・整形ユーティリティ機能を提供します。
 */

/**
 * 指定された日付が営業日（土日および祝日でない日）かを判定します。
 *
 * @param {Date|string} date 判定対象の日付
 * @return {boolean} 営業日の場合は true、休日・祝日の場合は false
 */
function isBusinessDay(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) throw new Error('エラー：無効な日付形式です。');

  const day = d.getDay();
  if (day === 0 || day === 6) return false; // 0:日, 6:土

  const year = d.getFullYear();
  const month = ('0' + (d.getMonth() + 1)).slice(-2);
  const dayStr = ('0' + d.getDate()).slice(-2);
  const dateStr = `${year}-${month}-${dayStr}`;

  // 同一ライブラリ内の HolidayService から祝日リストを取得して判定
  const holidays = getHolidaysList(year, year);
  return !holidays.includes(dateStr);
}

/**
 * 開始日から指定営業日分だけ前後の営業日を取得します。
 *
 * @param {Date|string} startDate 開始日付
 * @param {number} days 加算（減算）する営業日数
 * @return {Date} 計算後の営業日 Date オブジェクト
 */
function addBusinessDays(startDate, days) {
  let currentDate = new Date(startDate);
  if (isNaN(currentDate.getTime())) throw new Error('エラー：無効な日付形式です。');

  const step = days >= 0 ? 1 : -1;
  let remainingDays = Math.abs(days);

  while (remainingDays > 0) {
    currentDate.setDate(currentDate.getDate() + step);
    if (isBusinessDay(currentDate)) {
      remainingDays--;
    }
  }
  return currentDate;
}

/**
 * 指定日付が含まれる月の開始日（1日 00:00:00）と最終日（23:59:59）を取得します。
 *
 * @param {Date|string} date 対象日付
 * @return {{startDate: Date, endDate: Date}} 月始および月末の Date オブジェクト
 */
function getMonthRange(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) throw new Error('エラー：無効な日付形式です。');

  const year = d.getFullYear();
  const month = d.getMonth();

  const startDate = new Date(year, month, 1, 0, 0, 0);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  return { startDate, endDate };
}

/**
 * 日付を指定されたフォーマットの文字列に整形します。
 * 汎用性を考慮し、無効な日付が渡された場合はエラーで停止させず空文字を返します。
 * 
 * 対応プレースホルダ:
 * YYYY (年4桁), YY (年2桁), MM (月2桁), M (月1桁), DD (日2桁), D (日1桁)
 * HH (時2桁), H (時1桁), mm (分2桁), m (分1桁), ss (秒2桁), s (秒1桁)
 *
 * @param {Date|string|number} date 整形対象の日付（Dateオブジェクト、日付文字列、UNIXタイムスタンプ）
 * @param {string} format フォーマット文字列（例: 'YYYY/MM/DD HH:mm:ss'）
 * @return {string} 整形された日付文字列。無効な日付・空値の場合は空文字
 */
function formatDate(date, format) {
  // 空値のチェック
  if (date === null || date === undefined || date === '') {
    return '';
  }

  // 文字列型のUNIXタイムスタンプ（例: "1672531200000"）が渡された場合のケア
  let parsedDate = date;
  if (typeof date === 'string' && date.trim() !== '' && !isNaN(Number(date))) {
    parsedDate = Number(date);
  }

  const d = new Date(parsedDate);
  
  // Dateオブジェクトとして無効な場合は空文字を返す
  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  const map = {
    'YYYY': String(year),
    'YY': String(year).slice(-2),
    'MM': ('0' + month).slice(-2),
    'M': String(month),
    'DD': ('0' + day).slice(-2),
    'D': String(day),
    'HH': ('0' + hours).slice(-2),
    'H': String(hours),
    'mm': ('0' + minutes).slice(-2),
    'm': String(minutes),
    'ss': ('0' + seconds).slice(-2),
    's': String(seconds)
  };

  // 指定されたフォーマット文字を置換
  return format.replace(/YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s/g, match => map[match]);
}