import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
  const events = [];
  const navigate = useNavigate();

  const handleDateSelect = (date) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    navigate(`/day-details/${formattedDate}`);
  };

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
          formats={formats}
          components={{ toolbar: customToolbar }}
          views={{ month: true, week: true, day: true }}
          messages={messages}
        />
      </div>
    </div>
  );
};

export default MyCalendar;
