import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../api/client';
import { DAYS_OF_WEEK, FREQUENCY_OPTIONS, INTERVAL_TYPES } from '../constants';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';

const NumberStepper = ({ value, onChange, min = 1, max = 99, unit = '' }) => {
  const num = Number(value) || 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        className="btn btn--secondary"
        style={{ width: '40px', height: '40px', padding: 0, fontSize: '20px', lineHeight: '1', borderRadius: '50%' }}
        onClick={() => onChange(Math.max(min, num - 1))}
        disabled={num <= min}
      >
        −
      </button>
      <span style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '32px', textAlign: 'center' }}>{value || min}</span>
      <button
        type="button"
        className="btn btn--secondary"
        style={{ width: '40px', height: '40px', padding: 0, fontSize: '20px', lineHeight: '1', borderRadius: '50%' }}
        onClick={() => onChange(Math.min(max, num + 1))}
        disabled={num >= max}
      >
        +
      </button>
      {unit && <span style={{ fontSize: '14px', color: '#666' }}>{unit}</span>}
    </div>
  );
};

const ALL_STEPS = ['基本情報', '頻度設定', '時間・服用量', '確認'];
const PRN_STEPS = ['基本情報', '服用量', '確認'];

const AddTaskPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState(['']);
  const [selectedDosage, setSelectedDosage] = useState(1);
  const [doseAmount, setDoseAmount] = useState(1);
  const [doseAmounts, setDoseAmounts] = useState([1]);
  const [intervalType, setIntervalType] = useState('');
  const [intervalValue, setIntervalValue] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [errors, setErrors] = useState({});
  const modal = useModal();

  const isPrn = frequency === 'prn';
  const STEPS = isPrn ? PRN_STEPS : ALL_STEPS;

  // 表示ステップ番号を実際のロジックステップに変換
  const getLogicStep = (displayStep) => {
    if (isPrn) {
      if (displayStep === 0) return 0; // 基本情報
      if (displayStep === 1) return 2; // 服用量（時間・服用量ステップと同じロジック）
      return 3; // 確認
    }
    return displayStep;
  };

  const validateStep = (step) => {
    const logicStep = getLogicStep(step);
    const newErrors = {};
    if (logicStep === 0) {
      if (!taskName.trim()) newErrors.taskName = '薬の名前を入力してください';
      if (!unit.trim()) newErrors.unit = '単位を入力してください';
      if (isPrn && (doseAmount === '' || Number(doseAmount) < 1)) newErrors.doseAmount = '服用量を入力してください';
    }
    if (logicStep === 1 && !isPrn) {
      if (!frequency) newErrors.frequency = '頻度を選択してください';
      if ((frequency === 'daily' || frequency === 'weekly') && (selectedDosage === '' || Number(selectedDosage) < 1)) {
        newErrors.selectedDosage = '摂取回数を入力してください';
      }
      if (frequency === 'weekly' && selectedDays.length === 0) {
        newErrors.selectedDays = '曜日を1つ以上選択してください';
      }
      if (frequency === 'interval') {
        if (!intervalType) newErrors.intervalType = '間隔の種類を選択してください';
        if (!intervalValue || Number(intervalValue) <= 0) newErrors.intervalValue = '間隔の値を正しく入力してください';
      }
    }
    if (logicStep === 2) {
      if (isPrn) {
        if (doseAmount === '' || Number(doseAmount) < 1) newErrors.doseAmount = '服用量を入力してください';
      }
      const hasEmptyTime = !isPrn && selectedTimes.some((t) => !t);
      if (hasEmptyTime) newErrors.selectedTimes = 'すべての時間を設定してください';
      if (frequency === 'daily') {
        const count = selectedDosage || 1;
        const hasEmptyDose = doseAmounts.slice(0, count).some((d) => d === '' || Number(d) < 1);
        if (hasEmptyDose) newErrors.doseAmounts = 'すべての服用量を入力してください';
      } else {
        if (doseAmount === '' || Number(doseAmount) < 1) newErrors.doseAmount = '服用量を入力してください';
      }
      if (frequency === 'interval' && intervalType === 'hour' && !endTime) {
        newErrors.endTime = '終了時間を設定してください';
      }
      if (frequency === 'interval' && intervalType === 'day' && !startDate) {
        newErrors.startDate = '開始日を設定してください';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFrequencyChange = (newFrequency) => {
    setFrequency(newFrequency);
    // 頻度を切り替えたら関係ないステートをリセット
    if (newFrequency !== 'daily') {
      setSelectedDosage(1);
      setSelectedTimes(['']);
    }
    if (newFrequency !== 'weekly') {
      setSelectedDays([]);
    }
    if (newFrequency !== 'interval') {
      setIntervalType('');
      setIntervalValue('');
      setEndTime('');
      setStartDate('');
    }
  };

  const handleDosageChange = (value) => {
    if (value === '') {
      setSelectedDosage('');
      return;
    }
    const num = Math.max(1, Number(value));
    setSelectedDosage(num);
    setSelectedTimes((prev) => {
      const newTimes = Array.from({ length: num }, (_, i) => prev[i] || '');
      return newTimes;
    });
    setDoseAmounts((prev) => {
      return Array.from({ length: num }, (_, i) => prev[i] ?? doseAmount);
    });
  };

  const handleTimeChange = (index, value) => {
    setSelectedTimes((prev) => {
      const newTimes = [...prev];
      newTimes[index] = value;
      return newTimes;
    });
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const resetForm = () => {
    setTaskName('');
    setUnit('');
    setFrequency('');
    setSelectedDays([]);
    setSelectedTimes(['']);
    setSelectedDosage(1);
    setDoseAmount(1);
    setDoseAmounts([1]);
    setIntervalType('');
    setIntervalValue('');
    setEndTime('');
    setStartDate('');
    setCurrentStep(0);
    setErrors({});
  };

  const handleSubmit = async () => {
    try {
      const dailyDoseAmounts = frequency === 'daily' ? doseAmounts.slice(0, selectedDosage) : null;
      const payload = {
        name: taskName,
        unit,
        frequency,
        doseAmount: dailyDoseAmounts ? dailyDoseAmounts[0] : doseAmount,
        selectedTimes: frequency === 'daily'
          ? selectedTimes
          : [selectedTimes[0] || ''],
      };
      if (frequency === 'daily') {
        payload.timesPerDay = selectedDosage;
        payload.doseAmounts = dailyDoseAmounts;
      }
      if (frequency === 'weekly') {
        payload.selectedDays = selectedDays;
      }
      if (frequency === 'interval') {
        payload.intervalType = intervalType;
        payload.intervalValue = intervalValue;
        if (intervalType === 'hour') {
          payload.endTime = endTime;
        }
        if (intervalType === 'day') {
          payload.startDate = startDate;
        }
      }
      await api.post('/api/tasks', payload);
      modal.showSuccess('タスクが保存されました！');
      resetForm();
    } catch {
      modal.showError('申し訳ございません。タスクの追加に失敗しました。');
    }
  };

  const summary = useMemo(() => {
    const freqLabel = FREQUENCY_OPTIONS[frequency] || '';
    let detail = '';
    if (frequency === 'daily') {
      detail = `1日${selectedDosage}回 (${selectedTimes.filter(Boolean).join(', ')})`;
    } else if (frequency === 'weekly') {
      detail = `${selectedDays.map((d) => d + '曜').join('・')} ${selectedTimes[0] || ''}`;
    } else if (frequency === 'interval') {
      const typeLabel = INTERVAL_TYPES[intervalType] || '';
      detail = `${intervalValue}${typeLabel}`;
    } else if (frequency === 'prn') {
      detail = '症状がある時に服用';
    }
    return { freqLabel, detail };
  }, [frequency, selectedDosage, selectedTimes, selectedDays, intervalType, intervalValue]);

  return (
    <div className="add-task">
      <Helmet>
        <title>お薬を追加 - PillTime</title>
        <meta name="description" content="新しいお薬のスケジュールを追加" />
      </Helmet>

      <Modal isOpen={modal.isOpen} message={modal.message} type={modal.type} onClose={modal.close} />

      <h1 className="page-title">お薬を追加</h1>

      <div className="stepper">
        {STEPS.map((label, index) => (
          <div key={label} className={`stepper__step ${index === currentStep ? 'stepper__step--active' : ''} ${index < currentStep ? 'stepper__step--done' : ''}`}>
            <div className="stepper__circle">{index < currentStep ? '\u2713' : index + 1}</div>
            <span className="stepper__label">{label}</span>
          </div>
        ))}
      </div>

      <div className="add-task__form">
        {currentStep === 0 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label" htmlFor="taskName">薬の名前</label>
              <input
                id="taskName"
                type="text"
                className={`form-input ${errors.taskName ? 'form-input--error' : ''}`}
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="例: ロキソニン"
              />
              {errors.taskName && <span className="form-error">{errors.taskName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="unit">単位</label>
              <input
                id="unit"
                type="text"
                className={`form-input ${errors.unit ? 'form-input--error' : ''}`}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="例: 錠, mg, mL"
              />
              {errors.unit && <span className="form-error">{errors.unit}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">頓服薬ですか？</label>
              <div className="radio-group">
                <label className={`radio-card ${!isPrn ? 'radio-card--selected' : ''}`}>
                  <input type="radio" name="isPrn" checked={!isPrn} onChange={() => { setFrequency(''); }} />
                  <span className="radio-card__label">いいえ（定時薬）</span>
                </label>
                <label className={`radio-card ${isPrn ? 'radio-card--selected' : ''}`}>
                  <input type="radio" name="isPrn" checked={isPrn} onChange={() => { setFrequency('prn'); }} />
                  <span className="radio-card__label">はい（必要な時だけ）</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && !isPrn && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">頻度</label>
              {errors.frequency && <span className="form-error">{errors.frequency}</span>}
              <div className="radio-group">
                {Object.entries(FREQUENCY_OPTIONS).filter(([key]) => key !== 'prn').map(([key, label]) => (
                  <label key={key} className={`radio-card ${frequency === key ? 'radio-card--selected' : ''}`}>
                    <input
                      type="radio"
                      name="frequency"
                      value={key}
                      checked={frequency === key}
                      onChange={() => handleFrequencyChange(key)}
                    />
                    <span className="radio-card__label">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {frequency === 'daily' && (
              <div className="form-group">
                <label className="form-label">1日の摂取回数</label>
                <NumberStepper value={selectedDosage} onChange={handleDosageChange} max={10} unit="回" />
              </div>
            )}

            {frequency === 'weekly' && (
              <div className="form-group">
                <label className="form-label">曜日を選択</label>
                {errors.selectedDays && <span className="form-error">{errors.selectedDays}</span>}
                <div className="day-selector">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`day-btn ${selectedDays.includes(day) ? 'day-btn--selected' : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {frequency === 'interval' && (
              <>
                <div className="form-group">
                  <label className="form-label">間隔の種類</label>
                  {errors.intervalType && <span className="form-error">{errors.intervalType}</span>}
                  <div className="radio-group">
                    {Object.entries(INTERVAL_TYPES).map(([key, label]) => (
                      <label key={key} className={`radio-card ${intervalType === key ? 'radio-card--selected' : ''}`}>
                        <input
                          type="radio"
                          name="intervalType"
                          value={key}
                          checked={intervalType === key}
                          onChange={() => setIntervalType(key)}
                        />
                        <span className="radio-card__label">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="intervalValue">間隔の値</label>
                  {errors.intervalValue && <span className="form-error">{errors.intervalValue}</span>}
                  <input
                    id="intervalValue"
                    type="number"
                    className={`form-input form-input--small ${errors.intervalValue ? 'form-input--error' : ''}`}
                    min="1"
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(e.target.value)}
                    placeholder={intervalType === 'hour' ? '何時間ごと' : '何日ごと'}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {getLogicStep(currentStep) === 2 && (
          <div className="form-step">
            {errors.selectedTimes && <span className="form-error">{errors.selectedTimes}</span>}
            {errors.doseAmounts && <span className="form-error">{errors.doseAmounts}</span>}
            {errors.doseAmount && <span className="form-error">{errors.doseAmount}</span>}

            {isPrn && (
              <div className="confirm-card" style={{ marginBottom: '12px', padding: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">1回あたりの服用量</label>
                  <NumberStepper value={doseAmount} onChange={setDoseAmount} unit={unit || '錠'} />
                </div>
              </div>
            )}

            {frequency === 'daily' && selectedTimes.map((time, index) => (
              <div key={index} className="confirm-card" style={{ marginBottom: '12px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#666' }}>{index + 1}回目</h4>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" htmlFor={`time-${index}`}>時間</label>
                  <input
                    id={`time-${index}`}
                    type="time"
                    className="form-input"
                    value={time}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">服用量</label>
                  <NumberStepper
                    value={doseAmounts[index] ?? 1}
                    onChange={(val) => {
                      setDoseAmounts((prev) => {
                        const next = [...prev];
                        next[index] = val;
                        return next;
                      });
                    }}
                    unit={unit || '錠'}
                  />
                </div>
              </div>
            ))}

            {frequency === 'weekly' && (
              <div className="confirm-card" style={{ marginBottom: '12px', padding: '16px' }}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" htmlFor="weeklyTime">服用時間</label>
                  <input
                    id="weeklyTime"
                    type="time"
                    className="form-input"
                    value={selectedTimes[0] || ''}
                    onChange={(e) => handleTimeChange(0, e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">服用量</label>
                  <NumberStepper value={doseAmount} onChange={setDoseAmount} unit={unit || '錠'} />
                </div>
              </div>
            )}

            {frequency === 'interval' && intervalType === 'hour' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="startTime">開始時間</label>
                  <input
                    id="startTime"
                    type="time"
                    className="form-input"
                    value={selectedTimes[0] || ''}
                    onChange={(e) => handleTimeChange(0, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="endTimeInput">終了時間</label>
                  {errors.endTime && <span className="form-error">{errors.endTime}</span>}
                  <input
                    id="endTimeInput"
                    type="time"
                    className={`form-input ${errors.endTime ? 'form-input--error' : ''}`}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">服用量</label>
                  <NumberStepper value={doseAmount} onChange={setDoseAmount} unit={unit || '錠'} />
                </div>
              </>
            )}

            {frequency === 'interval' && intervalType === 'day' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="startDateInput">開始日</label>
                  {errors.startDate && <span className="form-error">{errors.startDate}</span>}
                  <input
                    id="startDateInput"
                    type="date"
                    className={`form-input ${errors.startDate ? 'form-input--error' : ''}`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="dayStartTime">服用時間</label>
                  <input
                    id="dayStartTime"
                    type="time"
                    className="form-input"
                    value={selectedTimes[0] || ''}
                    onChange={(e) => handleTimeChange(0, e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">服用量</label>
                  <NumberStepper value={doseAmount} onChange={setDoseAmount} unit={unit || '錠'} />
                </div>
              </>
            )}
          </div>
        )}

        {getLogicStep(currentStep) === 3 && (
          <div className="form-step">
            <div className="confirm-card">
              <h3 className="confirm-card__title">入力内容の確認</h3>
              <dl className="confirm-card__list">
                <div className="confirm-card__row">
                  <dt>薬の名前</dt>
                  <dd>{taskName}</dd>
                </div>
                <div className="confirm-card__row">
                  <dt>単位</dt>
                  <dd>{unit}</dd>
                </div>
                <div className="confirm-card__row">
                  <dt>頻度</dt>
                  <dd>{summary.freqLabel}</dd>
                </div>
                <div className="confirm-card__row">
                  <dt>詳細</dt>
                  <dd>{summary.detail}</dd>
                </div>
                <div className="confirm-card__row">
                  <dt>服用量</dt>
                  <dd>
                    {frequency === 'daily'
                      ? selectedTimes.map((t, i) => `${t || '未設定'}: ${doseAmounts[i] ?? 1}${unit}`).join('、')
                      : `${doseAmount} ${unit}`
                    }
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>

      <div className="add-task__nav">
        {currentStep > 0 && (
          <button type="button" className="btn btn--secondary" onClick={prevStep}>戻る</button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <button type="button" className="btn btn--primary" onClick={nextStep}>次へ</button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={handleSubmit}>登録する</button>
        )}
      </div>
    </div>
  );
};

export default AddTaskPage;
