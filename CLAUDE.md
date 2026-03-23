# PillTime - 開発ガイド

## 言語
- コミュニケーションは日本語で行うこと
- コード内のコメントも日本語で書くこと

## セットアップ
```bash
npm install
npm start        # 開発サーバー起動
npm run build    # 本番ビルド
```

## プロジェクト概要
お薬の服用管理PWAアプリ（React）。データはすべてlocalStorageに保存。

## 技術スタック
- React 18 + React Router 6
- TanStack React Query（データ管理）
- react-big-calendar + moment（カレンダー表示）
- localStorage（永続化、リモートAPIなし）

## データ構造
- `pilltime_medications`: 薬の一覧（登録・スケジュール管理用）
- `pilltime_day_details`: 日別詳細。各日付に以下の三つを格納:
  - `mood`: 体調（1-5）
  - `notes`: メモ（自由記述）
  - `records`: 摂取状況（薬から独立した自己完結型の記録配列）
    - 各レコード: `{ id, name, doseAmount, unit, time, status, type, timestamp }`
    - 薬IDへの紐づけなし。記録単体で意味が通る。
- `pilltime_history`: 薬の登録履歴
- `pilltime_notification_settings`: 通知設定

## 重要な注意点
- 服用記録は薬と紐づかない。記録は日記のように独立して蓄積される。
- 薬を削除しても記録は残る。

## 開発ルール
- 勝手に憶測で判断せず、仕様が不明確な場合は必ずユーザーに確認すること
- 大きな設計変更は実装前に仕様をヒアリングすること
- 人をおちょくる発言をしない
