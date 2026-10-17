/**
 * @file MailService.gs
 * @description 家計簿データの集計およびメールレポート送信処理を担当するファイル
 */

/**
 * 週次レポート（直近7日間）を集計してメール送信する関数（時間主導型トリガー用）
 */
function sendWeeklyReport() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
  
  const title = `【週次レポート】家計簿集計 (${formatDate(startDate)} ～ ${formatDate(endDate)})`;
  generateAndSendEmailReport(startDate, endDate, title);
}

/**
 * 月次レポート（前月1日〜末日）を集計してメール送信する関数（時間主導型トリガー用）
 */
function sendMonthlyReport() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  
  const title = `【月次レポート】家計簿集計 (${startDate.getFullYear()}年${startDate.getMonth() + 1}月度)`;
  generateAndSendEmailReport(startDate, endDate, title);
}

/**
 * 期間を指定してデータを集計し、HTMLピボットテーブルを含むメールを送信するコア関数
 * @param {Date} startDate - 集計開始日時
 * @param {Date} endDate - 集計終了日時
 * @param {string} reportTitle - メール件名およびヘッダータイトル
 */
function generateAndSendEmailReport(startDate, endDate, reportTitle) {
  let recipient = "";
  try {
    recipient = getScriptProperty_(CONFIG.PROPERTY_KEYS.NOTIFICATION_EMAIL);
  } catch (e) {
    console.error(e.message);
    return;
  }

  const ss = getTargetSpreadsheet();
  const historySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.HISTORY);
  if (!historySheet) return;

  const lastRow = historySheet.getLastRow();
  if (lastRow < 2) {
    console.log("集計対象のデータが存在しません。");
    return;
  }

  const data = historySheet.getRange(2, 1, lastRow - 1, 5).getValues();
  
  const pivotData = {};
  let totalIncome = 0;
  let totalExpense = 0;

  data.forEach(row => {
    const rowDate = new Date(row[0]);
    const type = row[1];
    const category = row[2];
    const amount = Number(row[3]);

    if (rowDate >= startDate && rowDate <= endDate) {
      if (!pivotData[category]) {
        pivotData[category] = { income: 0, expense: 0 };
      }

      if (type === "収入") {
        pivotData[category].income += amount;
        totalIncome += amount;
      } else if (type === "支出") {
        const absAmount = Math.abs(amount);
        pivotData[category].expense += absAmount;
        totalExpense += absAmount;
      }
    }
  });

  const netTotal = totalIncome - totalExpense;

  let htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1e3a8a; text-align: center;">${reportTitle}</h2>
      <p style="color: #4b5563;">以下の通り集計が完了しましたのでご報告いたします。</p>
      
      <!-- 概要カード -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f3f4f6;">
          <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;"><strong>総収入</strong><br><span style="color: #10b981; font-size: 1.2em;">+¥${totalIncome.toLocaleString()}</span></td>
          <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;"><strong>総支出</strong><br><span style="color: #ef4444; font-size: 1.2em;">-¥${totalExpense.toLocaleString()}</span></td>
          <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;"><strong>収支差引</strong><br><span style="color: ${netTotal >= 0 ? '#10b981' : '#ef4444'}; font-size: 1.2em;">¥${netTotal.toLocaleString()}</span></td>
        </tr>
      </table>

      <!-- ピボットテーブル -->
      <h3 style="color: #374151; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">内訳（カテゴリ別集計）</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #2563eb; color: white;">
            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">カテゴリ</th>
            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: right;">収入</th>
            <th style="padding: 8px; border: 1px solid #d1d5db; text-align: right;">支出</th>
          </tr>
        </thead>
        <tbody>
  `;

  const categories = Object.keys(pivotData);
  if (categories.length === 0) {
    htmlBody += `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #9ca3af;">該当期間のデータはありません。</td></tr>`;
  } else {
    categories.forEach(cat => {
      const inc = pivotData[cat].income;
      const exp = pivotData[cat].expense;
      htmlBody += `
        <tr>
          <td style="padding: 8px; border: 1px solid #d1d5db;">${cat}</td>
          <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right; color: ${inc > 0 ? '#10b981' : '#6b7280'};">¥${inc.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right; color: ${exp > 0 ? '#ef4444' : '#6b7280'};">¥${exp.toLocaleString()}</td>
        </tr>
      `;
    });
  }

  htmlBody += `
        </tbody>
      </table>
      <p style="margin-top: 20px; font-size: 0.8em; color: #9ca3af; text-align: center;">※本メールは Google Apps Script から自動送信されています。</p>
    </div>
  `;

  GmailApp.sendEmail(recipient, reportTitle, "HTMLメールに対応したクライアントでご確認ください。", {
    htmlBody: htmlBody
  });
}