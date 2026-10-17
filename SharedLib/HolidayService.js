/**
 * @file HolidayService.gs
 * @description Googleカレンダー連携による祝日判定・取得処理を提供します。
 */

/**
 * カレンダーイベントが「祭日」であるか判定します。
 *
 * @param {GoogleAppsScript.Calendar.CalendarEvent} event カレンダーイベントオブジェクト
 * @return {boolean} タイトルまたは詳細に「祭日」を含む場合は true
 */
function isFestivalEvent(event) {
  const description = event.getDescription() || '';
  const title = event.getTitle() || '';
  return description.includes('祭日') || title.includes('祭日');
}

/**
 * 日本の祝日一覧（YYYY-MM-DD形式の配列）を取得します（キャッシュ機能対応）。
 *
 * @param {number} [startYear] 取得開始年（省略時は前年）
 * @param {number} [endYear] 取得終了年（省略時は翌年）
 * @param {boolean} [useCache=true] キャッシュを使用するかどうか
 * @return {string[]} 祝日日付文字列の配列
 */
function getHolidaysList(startYear, endYear, useCache = true) {
  const now = new Date();
  const sYear = startYear || (now.getFullYear() - 1);
  const eYear = endYear || (now.getFullYear() + 1);
  const cacheKey = `${SHARED_CONFIG.CACHE_KEYS.HOLIDAYS_LIST}${sYear}_${eYear}`;
  const cache = CacheService.getScriptCache();

  if (useCache) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);
  }

  try {
    const calendar = CalendarApp.getCalendarById(SHARED_CONFIG.HOLIDAY_CALENDAR_ID);
    if (!calendar) return [];

    const startDate = new Date(sYear, 0, 1);
    const endDate = new Date(eYear, 11, 31, 23, 59, 59);
    const events = calendar.getEvents(startDate, endDate);

    const holidays = events
      .filter(event => !isFestivalEvent(event))
      .map(event => {
        const d = event.getStartTime();
        const year = d.getFullYear();
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const day = ('0' + d.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
      });

    if (useCache && holidays.length > 0) {
      cache.put(cacheKey, JSON.stringify(holidays), SHARED_CONFIG.CACHE_EXPIRATION_SEC);
    }
    return holidays;
  } catch (e) {
    console.error('祝日リストの取得失敗:', e);
    return [];
  }
}

/**
 * 日本の祝日情報をマップ形式（{ "YYYY-MM-DD": "祝日名" }）で取得します（キャッシュ機能対応）。
 *
 * @param {number} [startYear] 取得開始年（省略時は前年）
 * @param {number} [endYear] 取得終了年（省略時は翌年）
 * @param {boolean} [useCache=true] キャッシュを使用するかどうか
 * @return {Object<string, string>} 祝日マップオブジェクト
 */
function getHolidaysMap(startYear, endYear, useCache = true) {
  const now = new Date();
  const sYear = startYear || (now.getFullYear() - 1);
  const eYear = endYear || (now.getFullYear() + 1);
  const cacheKey = `${SHARED_CONFIG.CACHE_KEYS.HOLIDAYS_MAP}${sYear}_${eYear}`;
  const cache = CacheService.getScriptCache();

  if (useCache) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);
  }

  try {
    const calendar = CalendarApp.getCalendarById(SHARED_CONFIG.HOLIDAY_CALENDAR_ID);
    if (!calendar) return {};

    const startDate = new Date(sYear, 0, 1);
    const endDate = new Date(eYear, 11, 31, 23, 59, 59);
    const events = calendar.getEvents(startDate, endDate);

    const holidaysMap = {};
    events.forEach(event => {
      if (!isFestivalEvent(event)) {
        const d = event.getStartTime();
        const year = d.getFullYear();
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const day = ('0' + d.getDate()).slice(-2);
        const dateStr = `${year}-${month}-${day}`;
        holidaysMap[dateStr] = event.getTitle();
      }
    });

    if (useCache && Object.keys(holidaysMap).length > 0) {
      cache.put(cacheKey, JSON.stringify(holidaysMap), SHARED_CONFIG.CACHE_EXPIRATION_SEC);
    }
    return holidaysMap;
  } catch (e) {
    console.error('祝日マップの取得失敗:', e);
    return {};
  }
}