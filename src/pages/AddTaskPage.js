import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../api/client';
import { DAYS_OF_WEEK, FREQUENCY_OPTIONS, INTERVAL_TYPES } from '../constants';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';

const STEPS = ['基本情報', '頻度設定', '時間設定', '確認'];

const AddTaskPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState(['']);
  const [selectedDosage, setSelectedDosage] = useState(1);
  const [doseAmount, setDoseAmount] = useState(1);
  const [intervalType, setIntervalType] = useState('');
  const [intervalValue, setIntervalValue] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [errors, setErrors] = useState({});
  const modal = useModal();

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!taskName.trim()) newErrors.taskName = '薬の名前を入力してください';
      if (!unit.trim()) newErrors.unit = '単位を入力してください';
    }
    if (step === 1) {
      if (!frequency) newErrors.frequency = '頻度を選択してください';
      if (frequency === 'weekly' && selectedDays.length === 0) {
        newErrors.selectedDays = '曜日を1つ以上選択してください';
      }
      if (frequency === 'interval') {
        if (!intervalType) newErrors.intervalType = '間隔の種類を選択してください';
        if (!intervalValue || Number(intervalValue) <= 0) newErrors.intervalValue = '間隔の値を正しく入力してください';
      }
    }
    if (step === 2) {
      const hasEmptyTime = selectedTimes.some((t) => !t);
      if (hasEmptyTime) newErrors.selectedTimes = 'すべての時間を設定してください';
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

  const handleDosageChange = (value) => {
    const num = Math.max(1, Number(value));
    setSelectedDosage(num);
    setSelectedTimes((prev) => {
      const newTimes = Array.from({ length: num }, (_, i) => prev[i] || '');
      return newTimes;
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
    setIntervalType('');
    setIntervalValue('');
    setEndTime('');
    setStartDate('');
    setCurrentStep(0);
    setErrors({});
  };

  const handleSubmit = async () => {
    try {
      await api.post('/api/tasks', {
        name: taskName,
        unit,
        frequency,
        selectedDays,
        selectedTimes,
        selectedDosage,
        doseAmount,
        intervalType,
        intervalValue,
        endTime,
        startDate,
      });
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
              <label className="form-label" htmlFor="doseAmount">1回あたりの服用量</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="doseAmount"
                  type="number"
                  className="form-input form-input--small"
                  min="1"
                  value={doseAmount}
                  onChange={(e) => setDoseAmount(Math.max(1, Number(e.target.value)))}
                />
                <span className="form-label" style={{ marginBottom: 0 }}>{unit || '錠'}</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="form-step">
            <div className="form-group">
              <label className="form-label">頻度</label>
              {errors.frequency && <span className="form-error">{errors.frequency}</span>}
              <div className="radio-group">
                {Object.entries(FREQUENCY_OPTIONS).map(([key, label]) => (
                  <label key={key} className={`radio-card ${frequency === key ? 'radio-card--selected' : ''}`}>
                    <input
                      type="radio"
                      name="frequency"
                      value={key}
                      checked={frequency === key}
                      onChange={() => setFrequency(key)}
                    />
                    <span className="radio-card__label">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {frequency === 'daily' && (
              <div className="form-group">
                <label className="form-label" htmlFor="dosage">1日の摂取回数</label>
                <input
                  id="dosage"
                  type="number"
                  className="form-input form-input--small"
                  min="1"
                  max="10"
                  value={selectedDosage}
                  onChange={(e) => handleDosageChange(e.target.value)}
                />
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

        {currentStep === 2 && (
          <div className="form-step">
            {errors.selectedTimes && <span className="form-error">{errors.selectedTimes}</span>}

            {frequency === 'daily' && selectedTimes.map((time, index) => (
              <div key={index} className="form-group">
                <label className="form-label" htmlFor={`time-${index}`}>{index + 1}回目の時間</label>
                <input
                  id={`time-${index}`}
                  type="time"
                  className="form-input"
                  value={time}
                  onChange={(e) => handleTimeChange(index, e.target.value)}
                />
              </div>
            ))}

            {frequency === 'weekly' && (
              <div className="form-group">
                <label className="form-label" htmlFor="weeklyTime">服用時間</label>
                <input
                  id="weeklyTime"
                  type="time"
                  className="form-input"
                  value={selectedTimes[0] || ''}
                  onChange={(e) => handleTimeChange(0, e.target.value)}
                />
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
              </>
            )}
          </div>
        )}

        {currentStep === 3 && (
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
                  <dt>1回あたりの服用量</dt>
                  <dd>{doseAmount} {unit}</dd>
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
