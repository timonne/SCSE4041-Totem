import type { CSSProperties } from 'react';

export function Orb({ state = 'idle', compact = false }: { state?: 'idle' | 'thinking' | 'listening' | 'responding'; compact?: boolean }) {
  return (
    <svg className={`orb ${state} ${compact ? 'orb-compact' : ''}`} viewBox="0 0 220 220" role="img" aria-label={`AI interviewer is ${state}`}>
      <defs>
        <radialGradient id={`orbCore-${compact}`} cx="35%" cy="25%" r="75%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".28" stopColor="#8fb6ff" />
          <stop offset=".62" stopColor="#7b6cf6" />
          <stop offset="1" stopColor="#44389e" />
        </radialGradient>
        <radialGradient id={`orbGlow-${compact}`}>
          <stop offset="0" stopColor="#8b7cff" stopOpacity=".36" />
          <stop offset="1" stopColor="#8b7cff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="orb-float">
        <circle className="orb-glow" cx="110" cy="110" r="100" fill={`url(#orbGlow-${compact})`} />
        <g className="orb-rings">
          <ellipse cx="110" cy="110" rx="88" ry="48" fill="none" stroke="#8b7cff" strokeWidth="1" strokeDasharray="3 8" opacity=".55" transform="rotate(-18 110 110)" />
          <ellipse cx="110" cy="110" rx="62" ry="96" fill="none" stroke="#5a8cff" strokeWidth="1" strokeDasharray="42 14 8 14" opacity=".4" transform="rotate(38 110 110)" />
        </g>
        <g className="orb-particles">
          <circle cx="110" cy="18" r="3" fill="#8b7cff" /><circle cx="190" cy="143" r="2.5" fill="#5a8cff" /><circle cx="38" cy="159" r="2" fill="#c3baff" />
        </g>
        <g className="orb-core">
          <circle cx="110" cy="110" r="50" fill={`url(#orbCore-${compact})`} />
          <circle cx="110" cy="110" r="38" fill="none" stroke="#fff" strokeOpacity=".18" />
          <path d="M80 105 Q110 80 140 105" fill="none" stroke="#fff" strokeOpacity=".54" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

export function ScoreRing({ score, size = 150 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="score-ring" style={{ '--score': clamped, width: size, height: size } as CSSProperties}>
      <svg viewBox="0 0 120 120" aria-label={`Score ${clamped} out of 100`}>
        <circle className="score-track" cx="60" cy="60" r="50" />
        <circle className="score-progress" pathLength="100" cx="60" cy="60" r="50" transform="rotate(-90 60 60)" />
      </svg>
      <div><strong>{clamped}</strong><span>/ 100</span></div>
    </div>
  );
}

export function LineChart({ tall = false, data }: { tall?: boolean; data?: number[] }) {
  const values = (data && data.length > 0) ? data : [58, 64, 61, 72, 78, 84, 79, 88];
  const step = values.length > 1 ? 390 / (values.length - 1) : 0;
  const points = values.map((v, i) => `${25 + i * step},${155 - Math.max(0, Math.min(100, v) - 30) * 1.8}`).join(' ');
  const lastX = 25 + (values.length - 1) * step;

  return (
    <svg className={`line-chart ${tall ? 'chart-tall' : ''}`} viewBox="0 0 430 180" preserveAspectRatio="none" aria-label="Score progression chart">
      {[30, 70, 110, 150].map(y => <line key={y} x1="20" y1={y} x2="415" y2={y} className="chart-grid" />)}
      <defs><linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8b7cff" stopOpacity=".28" /><stop offset="1" stopColor="#8b7cff" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`${points} ${lastX},160 25,160`} fill="url(#chartArea)" />
      <polyline points={points} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <defs><linearGradient id="lineGradient"><stop stopColor="#8b7cff" /><stop offset="1" stopColor="#5a8cff" /></linearGradient></defs>
      {values.map((v, i) => <circle key={i} className="chart-point" cx={25 + i * step} cy={155 - Math.max(0, Math.min(100, v) - 30) * 1.8} r={i === values.length - 1 ? 5 : 3}><title>Interview {i + 1}: {v}</title></circle>)}
    </svg>
  );
}

export function RadarChart({ scores }: { scores?: Record<string, number> }) {
  // 6 dimensions: Technical, Relevance, Clarity, Depth, Problem Solving, Communication
  return (
    <svg className="radar-chart" viewBox="0 0 260 220" aria-label="Skill breakdown radar chart">
      {[1, .75, .5, .25].map((s) => <polygon key={s} points="130,20 222,72 222,158 130,210 38,158 38,72" transform={`translate(${130 * (1 - s)} ${115 * (1 - s)}) scale(${s})`} />)}
      {[[130,20],[222,72],[222,158],[130,210],[38,158],[38,72]].map(([x,y], i) => <line key={i} x1="130" y1="115" x2={x} y2={y} />)}
      <polygon className="radar-fill" points="130,32 204,76 211,151 130,190 55,151 59,79" />
    </svg>
  );
}

export function DonutChart({ count = 12 }: { count?: number }) {
  return <div className="donut" aria-label="Interview type distribution"><div><strong>{count}</strong><span>sessions</span></div></div>;
}

export function CompletionGraphic() {
  return (
    <svg className="completion" viewBox="0 0 180 180" aria-label="Interview completed">
      <circle className="completion-circle" cx="90" cy="90" r="55" />
      <path className="completion-check" pathLength="100" d="M62 90l18 19 38-40" />
      {[['32','55'],['143','47'],['151','120'],['40','135']].map(([x,y],i)=><circle className="completion-particle" key={i} cx={x} cy={y} r="3" />)}
    </svg>
  );
}
