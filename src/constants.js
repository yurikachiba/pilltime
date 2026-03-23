export const DAYS_OF_WEEK = ['月', '火', '水', '木', '金', '土', '日'];

export const NOTIFICATION_MESSAGES = {
  default: 'お薬の時間です',
  reminder: 'お薬を忘れずに',
};

export const MESSAGE_TYPE_LABELS = {
  default: '標準',
  reminder: 'リマインド',
};

export const FREQUENCY_OPTIONS = {
  daily: '毎日複数回',
  weekly: '特定の曜日',
  interval: '間隔',
  prn: '頓服（必要時）',
};

export const INTERVAL_TYPES = {
  hour: '時間ごと',
  day: '日ごと',
};

export const MOOD_MIN = 1;
export const MOOD_MAX = 5;

export const MOOD_FACES = [
  null, // index 0 unused
  { label: '最悪', icon: 'terrible' },
  { label: '悪い', icon: 'bad' },
  { label: '普通', icon: 'neutral' },
  { label: '良い', icon: 'good' },
  { label: '最高', icon: 'great' },
];
