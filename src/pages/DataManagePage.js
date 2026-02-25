import React, { useCallback, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';

const STORAGE_KEYS = {
  medications: 'pilltime_medications',
  history: 'pilltime_history',
  dayDetails: 'pilltime_day_details',
};

function getAllData() {
  const result = {};
  for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
    try {
      const raw = localStorage.getItem(storageKey);
      result[key] = raw ? JSON.parse(raw) : key === 'dayDetails' ? {} : [];
    } catch {
      result[key] = key === 'dayDetails' ? {} : [];
    }
  }
  return result;
}

function validateImportData(data) {
  if (typeof data !== 'object' || data === null) {
    return 'JSONオブジェクトではありません';
  }
  if (!data.medications && !data.history && !data.dayDetails) {
    return 'medications、history、dayDetailsのいずれかのキーが必要です';
  }
  if (data.medications !== undefined && !Array.isArray(data.medications)) {
    return 'medicationsは配列である必要があります';
  }
  if (data.history !== undefined && !Array.isArray(data.history)) {
    return 'historyは配列である必要があります';
  }
  if (data.dayDetails !== undefined && (typeof data.dayDetails !== 'object' || Array.isArray(data.dayDetails))) {
    return 'dayDetailsはオブジェクトである必要があります';
  }
  return null;
}

const DataManagePage = () => {
  const { isOpen, message, type, showSuccess, showError, close } = useModal();
  const fileInputRef = useRef(null);
  const [importMode, setImportMode] = useState('replace');

  const handleExport = useCallback(() => {
    try {
      const data = getAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `pilltime_backup_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('データをエクスポートしました');
    } catch {
      showError('エクスポートに失敗しました');
    }
  }, [showSuccess, showError]);

  const handleImport = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const error = validateImportData(data);
        if (error) {
          showError(error);
          return;
        }

        if (importMode === 'replace') {
          if (data.medications !== undefined) {
            localStorage.setItem(STORAGE_KEYS.medications, JSON.stringify(data.medications));
          }
          if (data.history !== undefined) {
            localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(data.history));
          }
          if (data.dayDetails !== undefined) {
            localStorage.setItem(STORAGE_KEYS.dayDetails, JSON.stringify(data.dayDetails));
          }
        } else {
          // マージモード
          if (data.medications !== undefined) {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.medications) || '[]');
            const existingIds = new Set(existing.map((m) => m.id));
            const merged = [...existing, ...data.medications.filter((m) => !existingIds.has(m.id))];
            localStorage.setItem(STORAGE_KEYS.medications, JSON.stringify(merged));
          }
          if (data.history !== undefined) {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]');
            const existingSet = new Set(existing.map((h) => `${h.name}_${h.date}`));
            const merged = [...existing, ...data.history.filter((h) => !existingSet.has(`${h.name}_${h.date}`))];
            localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(merged));
          }
          if (data.dayDetails !== undefined) {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.dayDetails) || '{}');
            const merged = { ...existing, ...data.dayDetails };
            localStorage.setItem(STORAGE_KEYS.dayDetails, JSON.stringify(merged));
          }
        }

        showSuccess('データをインポートしました');
      } catch {
        showError('JSONファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);

    // 同じファイルを再選択できるようにリセット
    event.target.value = '';
  }, [importMode, showSuccess, showError]);

  return (
    <div className="data-manage">
      <Helmet>
        <title>データ管理 - PillTime</title>
      </Helmet>

      <h1 className="page-title">データ管理</h1>
      <p className="data-manage__desc">お薬データのバックアップと復元ができます。</p>

      {/* エクスポート */}
      <section className="detail-section">
        <h2 className="detail-section__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          エクスポート
        </h2>
        <p className="data-manage__section-desc">
          すべてのお薬データ・服薬履歴・日々の記録をJSONファイルとしてダウンロードします。
        </p>
        <button className="btn btn--primary btn--full" onClick={handleExport}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          JSONファイルをダウンロード
        </button>
      </section>

      {/* インポート */}
      <section className="detail-section">
        <h2 className="detail-section__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          インポート
        </h2>
        <p className="data-manage__section-desc">
          エクスポートしたJSONファイルからデータを復元します。
        </p>

        <div className="data-manage__mode">
          <label className="form-label">インポート方法</label>
          <div className="radio-group">
            <label className={`radio-card ${importMode === 'replace' ? 'radio-card--selected' : ''}`}>
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
              />
              <div>
                <div className="radio-card__label">上書き</div>
                <div className="data-manage__mode-desc">既存データを置き換えます</div>
              </div>
            </label>
            <label className={`radio-card ${importMode === 'merge' ? 'radio-card--selected' : ''}`}>
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
              />
              <div>
                <div className="radio-card__label">マージ</div>
                <div className="data-manage__mode-desc">既存データに追加します（重複はスキップ）</div>
              </div>
            </label>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <button
          className="btn btn--secondary btn--full"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          JSONファイルを選択
        </button>
      </section>

      <Modal
        isOpen={isOpen}
        type={type}
        message={message}
        onClose={close}
      />
    </div>
  );
};

export default DataManagePage;
