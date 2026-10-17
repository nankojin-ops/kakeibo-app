/**
 * @file SessionService.gs
 * @description 実行ユーザー情報の取得およびセッション管理機能を提供します。
 */

/**
 * アクティブユーザーのメールアドレスを安全に取得します。
 * 権限不足等で取得できない場合は例外を出さずに空文字を返します。
 *
 * @return {string} メールアドレス（小文字整形済み）または空文字
 */
function getSafeActiveUserEmail() {
  try {
    const email = Session.getActiveUser().getEmail();
    return email ? String(email).trim().toLowerCase() : '';
  } catch (e) {
    console.warn('[SessionService] ユーザーメールアドレスの取得に失敗しました:', e.message);
    return '';
  }
}

/**
 * 指定されたメールアドレスが特定の組織ドメインに属しているか判定します。
 *
 * @param {string} email 判定対象のメールアドレス
 * @param {string} domain 対象のドメイン（例: 'example.com'）
 * @return {boolean} 組織ドメインに一致する場合は true
 */
function isOrganizationUser(email, domain) {
  if (!email || !domain) return false;
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanDomain = String(domain).trim().toLowerCase().replace(/^@/, '');
  return cleanEmail.endsWith(`@${cleanDomain}`);
}