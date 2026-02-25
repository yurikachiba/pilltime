import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import TodayMeds from './pages/TodayMeds';
import MyCalendar from './pages/MyCalendar';
import RecordPage from './pages/RecordPage';
import AddTaskPage from './pages/AddTaskPage';
import DayDetailsPage from './pages/DayDetailsPage';
import LandingPage from './pages/LandingPage';
import DataManagePage from './pages/DataManagePage';
import ErrorBoundary from './pages/ErrorBoundary';
import BottomNav from './components/BottomNav';

import './App.css';

function AppLayout() {
  return (
    <div className="app">
      <BottomNav />
      <main className="app__main">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route path="/landing" element={<LandingPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<TodayMeds />} />
              <Route path="/calendar" element={<MyCalendar />} />
              <Route path="/records" element={<RecordPage />} />
              <Route path="/add-task" element={<AddTaskPage />} />
              <Route path="/day-details/:date" element={<DayDetailsPage />} />
              <Route path="/data" element={<DataManagePage />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </Router>
    </HelmetProvider>
  );
}

export default App;
