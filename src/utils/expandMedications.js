// 複数回服用の薬を時間ごとに展開するユーティリティ
import { parseLocalDate } from './dateUtils';

// 日曜始まりの曜日名（Date.getDay()に対応）
const DAY_NAMES_SUNDAY_START = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * daily薬を時間ごとに展開し、時間順にソート
 */
export function expandMedsByTime(meds) {
  return meds
    .flatMap((med) => {
      if (med.frequency === 'daily' && med.selectedTimes && med.selectedTimes.length > 1) {
        return med.selectedTimes.map((t, i) => ({
          ...med,
          id: `${med.id}_${i}`,
          _originalId: med.id,
          _timeIndex: i,
          time: t,
          doseAmount: med.doseAmounts?.[i] ?? med.doseAmount,
        }));
      }
      return [{ ...med, _originalId: med.id, _timeIndex: 0 }];
    })
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}

/**
 * 指定日に該当する定時薬をフィルタ→展開して返す
 */
export function getScheduledMedsForDate(medications, dateStr) {
  const date = parseLocalDate(dateStr);
  const dayName = DAY_NAMES_SUNDAY_START[date.getDay()];

  const filtered = medications.filter((med) => {
    if (med.frequency === 'prn') return false;
    if (med.frequency === 'weekly' && med.selectedDays && !med.selectedDays.includes(dayName)) return false;
    if (med.frequency === 'interval' && med.intervalType === 'day' && med.startDate && med.intervalValue) {
      const start = parseLocalDate(med.startDate);
      const now = parseLocalDate(dateStr);
      const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || diffDays % Number(med.intervalValue) !== 0) return false;
    }
    return true;
  });

  return expandMedsByTime(filtered);
}
