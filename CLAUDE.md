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
- `pilltime_medications`: 薬の一覧
- `takenMeds_{DATE}`: 日付ごとの服用済みID一覧（今日のお薬・カレンダーが使用）
- `skippedMeds_{DATE}`: 日付ごとのスキップ済みID一覧
- `pilltime_day_details`: 日別詳細（体調・メモ・服用状況）
- `pilltime_prn_logs`: 頓服薬の服用記録
- `pilltime_notification_settings`: 通知設定

## 重要な注意点
- `takenMeds_{DATE}` と `pilltime_day_details[date].takenMedications` は常に同期を保つこと
- 片方だけ更新すると、ページ間で服薬状況が不整合になる
