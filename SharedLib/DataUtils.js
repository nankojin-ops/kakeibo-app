/**
 * @file DataUtils.gs
 * @description 大量データ分割、2次元配列の転置、ディープコピー等の配列・オブジェクト操作機能を提供します。
 */

/**
 * 1次元配列を指定されたサイズごとに分割（チャンク化）します。
 *
 * @param {Array} array 分割対象の配列
 * @param {number} chunkSize 1要素あたりの最大サイズ
 * @return {Array<Array>} 分割された2次元配列
 */
function chunkArray(array, chunkSize) {
  if (!Array.isArray(array) || chunkSize <= 0) return [];
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

/**
 * 2次元配列の行と列を入れ替えます（転置行列変換）。
 *
 * @param {Array<Array>} matrix 対象の2次元配列
 * @return {Array<Array>} 転置された2次元配列
 */
function transpose(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0])) {
    return [];
  }
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

/**
 * オブジェクトおよび配列のディープコピー（深層複製）を作成します。
 *
 * @param {*} object 複製対象のオブジェクトまたは配列
 * @return {*} 複製されたオブジェクト
 */
function deepCopy(object) {
  if (object === null || object === undefined) return object;
  return JSON.parse(JSON.stringify(object));
}