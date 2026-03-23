import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../api/client';

moment.locale('ja');

const formats = {
  dateFormat: 'D',
  dayFormat: 'D(ddd)',
  monthHeaderFormat: 'YYYY年M月',
  dayHeaderFormat: 'M月D日(ddd)',
  dayRangeHeaderFormat: 'YYYY年M月',
};

const messages = {
  noEventsInRange: 'この範囲にはイベントがありません。',
  today: '今日',
  previous: '前へ',
  next: '次へ',
  month: '月',
  week: '週',
  day: '日',
  agenda: 'スケジュール',
};

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
  const navigate = useNavigate();

  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => api.get('/api/medications'),
  });

  const { data: takenByDate = {} } = useQuery({
    queryKey: ['takenByDate'],
    queryFn: () => {
      const taken = {};
      const today = moment();
      for (let i = 0; i < 90; i++) {
        const date = today.clone().subtract(i, 'days').format('YYYY-MM-DD');
        const raw = localStorage.getItem(`takenMeds_${date}`);
        if (raw) {
          try {
            taken[date] = JSON.parse(raw);
          } catch {
            // ignore
          }
        }
      }
      return taken;
    },
  });

  const events = useMemo(() => {
    const result = [];
    const scheduledMeds = medications.filter((m) => m.frequency !== 'prn');
    const medMap = {};
    for (const med of medications) {
      medMap[med.id] = med;
    }

    // 過去の各日について、服用/未服用を判定
    const today = moment();
    for (let i = 0; i < 90; i++) {
      const date = today.clone().subtract(i, 'days').format('YYYY-MM-DD');
      const takenIds = takenByDate[date] || [];
      const day = moment(date).toDate();

      for (const med of scheduledMeds) {
        const taken = takenIds.includes(med.id);
        result.push({
          title: taken ? `${med.name}` : `${med.name}`,
          start: day,
          end: day,
          allDay: true,
          medId: med.id,
          taken,
        });
      }
    }
    return result;
  }, [medications, takenByDate]);

  const handleDateSelect = (date) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    navigate(`/day-details/${formattedDate}`);
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.taken ? '#4CAF50' : '#e53e3e',
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      fontSize: '11px',
      padding: '1px 4px',
    },
  });

  const customToolbar = (toolbar) => {
    return (
      <div className="cal-toolbar">
        <div className="cal-toolbar__nav">
          <button type="button" className="cal-toolbar__btn" onClick={() => toolbar.onNavigate('PREV')} aria-label="前月">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button type="button" className="cal-toolbar__btn cal-toolbar__btn--today" onClick={() => toolbar.onNavigate('TODAY')}>今日</button>
          <button type="button" className="cal-toolbar__btn" onClick={() => toolbar.onNavigate('NEXT')} aria-label="次月">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <div className="cal-toolbar__views">
          {[
            { view: Views.MONTH, label: '月' },
            { view: Views.WEEK, label: '週' },
            { view: Views.DAY, label: '日' },
          ].map(({ view, label }) => (
            <button
              key={view}
              type="button"
              className={`cal-toolbar__view-btn ${toolbar.view === view ? 'cal-toolbar__view-btn--active' : ''}`}
              onClick={() => toolbar.onView(view)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-page">
      <Helmet>
        <title>カレンダー - PillTime</title>
        <meta name="description" content="お薬の服用スケジュールをカレンダーで管理" />
      </Helmet>
      <h1 className="page-title">カレンダー</h1>
      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          selectable
          onSelectSlot={(slotInfo) => handleDateSelect(slotInfo.start)}
          onSelectEvent={(event) => handleDateSelect(event.start)}
          formats={formats}
          components={{ toolbar: customToolbar }}
          views={{ month: true, week: true, day: true }}
          messages={messages}
          eventPropGetter={eventStyleGetter}
        />
      </div>
    </div>
  );
};

export default MyCalendar;
