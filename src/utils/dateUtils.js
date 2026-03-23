// ローカルタイムゾーンで今日の日付文字列を返す（YYYY-MM-DD形式）
export function getLocalToday() {
  return formatLocalDate(new Date());
}

// Dateオブジェクトをローカルタイムゾーンで YYYY-MM-DD 形式に変換
export function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// YYYY-MM-DD 文字列をローカルタイムゾーンの Date として解釈する
// （new Date('YYYY-MM-DD') はUTCとして解釈されるため）
export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
