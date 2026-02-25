import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ReactComponent as Logo } from '../logo.svg';

const features = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    title: '服薬管理',
    description: '毎日のお薬を一覧で管理。服用状況をワンタップで記録できます。',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'リマインダー',
    description: 'お薬の時間を通知でお知らせ。おかん風や猫風など、楽しいメッセージも。',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'カレンダー',
    description: '月間カレンダーで服薬スケジュールを一目で確認できます。',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: '服薬記録',
    description: '過去の服薬履歴を確認。毎日の気分やメモも一緒に記録。',
  },
];

const LandingPage = () => {
  return (
    <div className="landing">
      <Helmet>
        <title>PillTime - お薬管理アプリ</title>
        <meta name="description" content="PillTime - お薬の服用管理・リマインダーアプリ。毎日のお薬を忘れずに管理できます。完全無料。" />
      </Helmet>

      {/* Hero Section */}
      <section className="landing__hero">
        <div className="landing__hero-bg" />
        <div className="landing__hero-content">
          <div className="landing__logo">
            <Logo className="landing__logo-icon" />
          </div>
          <h1 className="landing__title">PillTime</h1>
          <p className="landing__tagline">お薬の管理を、もっとシンプルに。</p>
          <p className="landing__subtitle">
            毎日の服薬スケジュールを簡単管理。
            <br />
            リマインダー機能で飲み忘れを防止します。
          </p>
          <Link to="/" className="landing__cta">
            今すぐはじめる
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing__features">
        <h2 className="landing__section-title">主な機能</h2>
        <div className="landing__features-grid">
          {features.map((feature, index) => (
            <div className="landing__feature-card" key={index}>
              <div className="landing__feature-icon">{feature.icon}</div>
              <h3 className="landing__feature-title">{feature.title}</h3>
              <p className="landing__feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing__steps">
        <h2 className="landing__section-title">かんたん3ステップ</h2>
        <div className="landing__steps-list">
          <div className="landing__step">
            <div className="landing__step-number">1</div>
            <div className="landing__step-content">
              <h3 className="landing__step-title">お薬を登録</h3>
              <p className="landing__step-desc">お薬の名前、用量、服用タイミングを入力します。</p>
            </div>
          </div>
          <div className="landing__step">
            <div className="landing__step-number">2</div>
            <div className="landing__step-content">
              <h3 className="landing__step-title">リマインダーを設定</h3>
              <p className="landing__step-desc">通知メッセージのスタイルを選んで、お好みに設定。</p>
            </div>
          </div>
          <div className="landing__step">
            <div className="landing__step-number">3</div>
            <div className="landing__step-content">
              <h3 className="landing__step-title">服薬を記録</h3>
              <p className="landing__step-desc">ワンタップで服薬完了。履歴もカレンダーで確認できます。</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing__bottom-cta">
        <div className="landing__bottom-cta-card">
          <h2 className="landing__bottom-cta-title">完全無料で使えます</h2>
          <p className="landing__bottom-cta-desc">
            アカウント登録不要。ブラウザだけですぐに始められます。
          </p>
          <Link to="/" className="landing__cta">
            アプリを始める
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <p>&copy; 2026 PillTime. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
