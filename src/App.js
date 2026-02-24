import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import TodayMeds from './pages/TodayMeds';
import MyCalendar from './pages/MyCalendar';
import RecordPage from './pages/RecordPage';
import AddTaskPage from './pages/AddTaskPage';
import DayDetailsPage from './pages/DayDetailsPage';
import ErrorBoundary from './pages/ErrorBoundary';
import BottomNav from './components/BottomNav';

import './App.css';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ErrorBoundary>
          <div className="app">
            <main className="app__main">
              <Routes>
                <Route path="/" element={<TodayMeds />} />
                <Route path="/calendar" element={<MyCalendar />} />
                <Route path="/records" element={<RecordPage />} />
                <Route path="/add-task" element={<AddTaskPage />} />
                <Route path="/day-details/:date" element={<DayDetailsPage />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </ErrorBoundary>
      </Router>
    </HelmetProvider>
  );
}

export default App;
