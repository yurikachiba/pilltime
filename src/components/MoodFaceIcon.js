import React from 'react';

// SVGの顔アイコン（シンプルな線画）
const MoodFaceIcon = ({ type, size = 32 }) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s / 2 - 2;
  const eyeY = cy - r * 0.15;
  const eyeLX = cx - r * 0.3;
  const eyeRX = cx + r * 0.3;
  const mouthY = cy + r * 0.3;

  let eyes = null;
  let mouth = null;

  switch (type) {
    case 'terrible':
      eyes = (
        <>
          <line x1={eyeLX - 2} y1={eyeY - 2} x2={eyeLX + 2} y2={eyeY + 2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1={eyeLX + 2} y1={eyeY - 2} x2={eyeLX - 2} y2={eyeY + 2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1={eyeRX - 2} y1={eyeY - 2} x2={eyeRX + 2} y2={eyeY + 2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1={eyeRX + 2} y1={eyeY - 2} x2={eyeRX - 2} y2={eyeY + 2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      );
      mouth = <path d={`M${cx - r * 0.3} ${mouthY + 3} Q${cx} ${mouthY - 4} ${cx + r * 0.3} ${mouthY + 3}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    case 'bad':
      eyes = (
        <>
          <circle cx={eyeLX} cy={eyeY} r="2" fill="currentColor" />
          <circle cx={eyeRX} cy={eyeY} r="2" fill="currentColor" />
        </>
      );
      mouth = <path d={`M${cx - r * 0.25} ${mouthY + 2} Q${cx} ${mouthY - 3} ${cx + r * 0.25} ${mouthY + 2}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    case 'neutral':
      eyes = (
        <>
          <circle cx={eyeLX} cy={eyeY} r="2" fill="currentColor" />
          <circle cx={eyeRX} cy={eyeY} r="2" fill="currentColor" />
        </>
      );
      mouth = <line x1={cx - r * 0.25} y1={mouthY} x2={cx + r * 0.25} y2={mouthY} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    case 'good':
      eyes = (
        <>
          <circle cx={eyeLX} cy={eyeY} r="2" fill="currentColor" />
          <circle cx={eyeRX} cy={eyeY} r="2" fill="currentColor" />
        </>
      );
      mouth = <path d={`M${cx - r * 0.25} ${mouthY - 1} Q${cx} ${mouthY + 4} ${cx + r * 0.25} ${mouthY - 1}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    case 'great':
      eyes = (
        <>
          <path d={`M${eyeLX - 3} ${eyeY} Q${eyeLX} ${eyeY - 4} ${eyeLX + 3} ${eyeY}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d={`M${eyeRX - 3} ${eyeY} Q${eyeRX} ${eyeY - 4} ${eyeRX + 3} ${eyeY}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      );
      mouth = <path d={`M${cx - r * 0.3} ${mouthY - 2} Q${cx} ${mouthY + 5} ${cx + r * 0.3} ${mouthY - 2}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      break;
    default:
      break;
  }

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth="2" fill="none" />
      {eyes}
      {mouth}
    </svg>
  );
};

export default MoodFaceIcon;
