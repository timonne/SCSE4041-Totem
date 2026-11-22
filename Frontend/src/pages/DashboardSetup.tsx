import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { roles, sessions as fallbackSessions } from '../data';
import type { InterviewConfig, OverviewStatsData, Page, Session } from '../types';
import { Badge, Button, Card, Icon, PageTitle } from '../components/UI';
import { LineChart, Orb } from '../components/Visuals';

export function Overview({
  navigate,
  onSelectSession,
}: {
  navigate: (p: Page) => void;
  onSelectSession?: (id: number) => void;
}) {
  const [range, setRange] = useState('30 days');
  const [stats, setStats] = useState<OverviewStatsData | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.getOverviewAnalytics(),
      api.getInterviews()
    ]).then(([statsRes, sessionsRes]) => {
      if (!active) return;
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
      if (sessionsRes.status === 'fulfilled' && sessionsRes.value) {
        setRecentSessions(sessionsRes.value);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const displaySessions = recentSessions.length > 0 ? recentSessions : (stats?.interviews_completed === 0 ? [] : fallbackSessions);
  const completedCount = stats ? stats.interviews_completed : 12;
  const avgScore = stats ? stats.average_score : 78;
  const practiceTime = stats ? stats.total_practice_time : '4h 25m';
  const improvement = stats ? stats.improvement_points : '+14 points';
  const chartData = stats?.recent_scores && stats.recent_scores.length > 0 ? stats.recent_scores : undefined;

  const statItems = [
    ['Interviews completed', `${completedCount}`, stats ? `+${stats.interviews_this_week} this week` : '+3 this week', 'history'],
    ['Average score', `${avgScore}/100`, stats?.score_change_percent || '+6% from last month', 'chart'],
    ['Practice time', practiceTime, `Across ${completedCount} sessions`, 'clock'],
    ['Improvement', improvement, 'Overall progress', 'spark'],
  ];

  return (
    <div className="page">
      <div className="dashboard-top">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>Good evening, Alex</h1>
          <p>Ready to sharpen your interview skills?</p>
        </div>
        <div className="top-actions">
          <button className="icon-button" aria-label="Notifications"><Icon name="bell" /></button>
          <span className="avatar">AM</span>
          <Button onClick={() => navigate('setup')}>
            <Icon name="plus" size={17} /> Start a new interview
          </Button>
        </div>
      </div>

      <Card className="hero-card">
        <div className="hero-copy">
          <Badge tone="violet"><Icon name="spark" size={13} /> AI-POWERED PRACTICE</Badge>
          <h2>Your next interview<br />starts here.</h2>
          <p>Practice real-world interviews, get instant feedback, and improve with every session.</p>
          <div>
            <Button onClick={() => navigate('setup')}>
              Start practicing <Icon name="arrow" size={17} />
            </Button>
            <Button variant="ghost" onClick={() => navigate('ai')}>View how it works</Button>
          </div>
        </div>
        <div className="hero-visual">
          <Orb compact />
          <span className="visual-chip chip-one"><i /> Adaptive questions</span>
          <span className="visual-chip chip-two">Live evaluation</span>
        </div>
      </Card>

      <div className="stat-grid">
        {statItems.map(([label, value, note, icon]) => (
          <Card className="stat-card" key={label}>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
            <i><Icon name={icon} /></i>
          </Card>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card className="chart-card">
          <div className="section-head">
            <div>
              <h3>Your performance</h3>
              <p>Score progression across recent interviews</p>
            </div>
            <div className="segment compact">
              {['7 days', '30 days', '90 days'].map(x => (
                <button key={x} onClick={() => setRange(x)} className={range === x ? 'active' : ''}>{x}</button>
              ))}
            </div>
          </div>
          <LineChart data={chartData} />
          <div className="chart-axis">
            {(chartData || [1, 2, 3, 4, 5, 6]).map((_, i) => (
              <span key={i}>Interview {i + 1}</span>
            ))}
          </div>
        </Card>

        <Card className="practice-card">
          <div className="section-head">
            <div>
              <h3>Recommended practice</h3>
              <p>Based on your recent results</p>
            </div>
          </div>
          {(stats?.recommended_practice || [
            { num: '01', title: 'Technical fundamentals', note: 'Build deeper conceptual knowledge' },
            { num: '02', title: 'Behavioral storytelling', note: 'Structure impact-focused examples' },
            { num: '03', title: 'Problem-solving', note: 'Explain your reasoning aloud' },
          ]).map((item) => (
            <div className="practice-row" key={item.title}>
              <span>{item.num}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.note}</small>
              </div>
              <button onClick={() => navigate('setup')}>Practice</button>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <div className="section-head">
          <div>
            <h3>Recent sessions</h3>
            <p>Review your latest interview performance</p>
          </div>
          <button className="text-button" onClick={() => navigate('history')}>
            View all <Icon name="arrow" size={15} />
          </button>
        </div>

        {displaySessions.length > 0 ? (
          <div className="session-list">
            {displaySessions.slice(0, 4).map((s, i) => (
              <button
                key={s.id}
                className="session-row"
                onClick={() => {
                  if (onSelectSession) onSelectSession(s.id);
                  navigate('report');
                }}
              >
                <span className={`role-icon role-${i % 5}`}>{s.role.slice(0, 2).toUpperCase()}</span>
                <span className="session-main">
                  <strong>{s.role}</strong>
                  <small>{s.type} Interview · {s.date}</small>
                </span>
                <Badge tone={s.status === 'Completed' || !s.status ? 'green' : 'amber'}>
                  {s.status || 'Completed'}
                </Badge>
                <span className="session-meta">
                  <small>SCORE</small>
                  <strong>{s.score}<i>/100</i></strong>
                </span>
                <span className="session-meta hide-mobile">
                  <small>QUESTIONS</small>
                  <strong>{s.questions}</strong>
                </span>
                <Icon name="arrow" size={18} />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '30px 10px' }}>
            <div className="empty-doc"><span>✓</span></div>
            <h2>No interviews recorded yet</h2>
            <p>Complete your first interview to see live progress and reviews here.</p>
            <Button onClick={() => navigate('setup')}>Start your first interview</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

const experiences = [
  ['Beginner', 'Build confidence with core concepts.'],
  ['Internship', 'Focus on fundamentals and learning ability.'],
  ['Entry-Level', 'Projects, principles, and practical skills.'],
  ['Intermediate', 'Applied reasoning and ownership.'],
  ['Advanced', 'Leadership and complex trade-offs.'],
];
const types = [
  ['Technical', 'Concepts, coding, and problem-solving.'],
  ['Behavioral', 'Experiences, teamwork, and decisions.'],
  ['HR', 'Motivation, goals, and workplace fit.'],
  ['Mixed', 'A balanced, realistic combination.'],
];
const suggestions: Record<string, string[]> = {
  'Data Analyst': ['SQL', 'Excel', 'Python', 'Statistics', 'Power BI', 'Data Visualization'],
  default: ['JavaScript', 'React', 'DSA', 'OOP', 'DBMS', 'System Design'],
};

export function Setup({
  config,
  setConfig,
  start,
  navigate,
}: {
  config: InterviewConfig;
  setConfig: (c: InterviewConfig) => void;
  start: (createdInterviewId?: number) => void;
  navigate: (p: Page) => void;
}) {
  const [roleSearch, setRoleSearch] = useState('');
  const [custom, setCustom] = useState('');
  const [skill, setSkill] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => roles.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase())), [roleSearch]);
  const update = (key: keyof InterviewConfig, value: InterviewConfig[keyof InterviewConfig]) =>
    setConfig({ ...config, [key]: value });
  const addSkill = (value: string) => {
    const clean = value.trim();
    if (clean && !config.skills.includes(clean)) update('skills', [...config.skills, clean]);
    setSkill('');
  };

  const go = async () => {
    if (!config.role || !config.experience || !config.type) {
      setError('Choose a role, experience level, and interview type to continue.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const interview = await api.createInterview(config);
      setLoading(false);
      start(interview.id);
    } catch (err: any) {
      console.warn('Backend interview creation error, falling back locally:', err.message);
      setLoading(false);
      start();
    }
  };

  return (
    <div className="page setup-page">
      <PageTitle
        title="Configure your interview"
        subtitle="Tailor your session to the role you're preparing for."
        actions={<div className="step-label"><span>1</span> Setup <i /> <b>2</b> Interview <i /> <b>3</b> Results</div>}
      />
      <div className="setup-layout">
        <div className="setup-form">
          <SetupSection number="01" title="Choose your target role" subtitle="We'll tailor questions and evaluation criteria to this position.">
            <label className="search-box">
              <Icon name="search" size={18} />
              <input value={roleSearch} onChange={e => setRoleSearch(e.target.value)} placeholder="Search job roles..." />
            </label>
            <div className="role-grid">
              {filtered.map(role => (
                <button
                  className={`select-card role-choice ${config.role === role ? 'selected' : ''}`}
                  key={role}
                  onClick={() => update('role', role)}
                >
                  <span>{role === 'Other' ? '+' : role.split(' ').map(x => x[0]).join('').slice(0, 2)}</span>
                  <strong>{role}</strong>
                  {config.role === role && <i>✓</i>}
                </button>
              ))}
            </div>
            {config.role === 'Other' && (
              <input
                className="field"
                value={custom}
                onChange={e => {
                  setCustom(e.target.value);
                  update('role', e.target.value || 'Other');
                }}
                placeholder="Enter your target role"
              />
            )}
          </SetupSection>

          <SetupSection number="02" title="Experience level" subtitle="Select the level that best describes your current experience.">
            <div className="option-grid five">
              {experiences.map(([title, desc]) => (
                <button
                  key={title}
                  className={`select-card ${config.experience === title ? 'selected' : ''}`}
                  onClick={() => update('experience', title)}
                >
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </SetupSection>

          <SetupSection number="03" title="Interview type" subtitle="Choose the format you want to practice.">
            <div className="option-grid four">
              {types.map(([title, desc], i) => (
                <button
                  key={title}
                  className={`select-card type-card ${config.type === title ? 'selected' : ''}`}
                  onClick={() => update('type', title)}
                >
                  <span className="type-icon"><Icon name={['settings', 'help', 'home', 'spark'][i]} /></span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </SetupSection>

          <SetupSection number="04" title="Difficulty" subtitle="Set the depth and complexity of your questions.">
            <div className="segment large">
              {[
                ['Easy', 'Fundamentals and familiar concepts.'],
                ['Medium', 'Practical application and reasoning.'],
                ['Hard', 'Complex scenarios and deeper reasoning.'],
              ].map(([title, desc]) => (
                <button
                  key={title}
                  className={config.difficulty === title ? 'active' : ''}
                  onClick={() => update('difficulty', title)}
                >
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </SetupSection>

          <SetupSection number="05" title="Interview length" subtitle="How long would you like to practice?">
            <div className="option-grid three">
              {[
                [5, 'Quick practice', '~15 min'],
                [10, 'Standard session', '~30 min'],
                [15, 'Full interview', '~45 min'],
              ].map(([n, label, time]) => (
                <button
                  className={`select-card length-card ${config.length === n ? 'selected' : ''}`}
                  key={n}
                  onClick={() => update('length', n as number)}
                >
                  <strong>{n} <small>questions</small></strong>
                  <span>{label}</span>
                  <em>{time}</em>
                </button>
              ))}
            </div>
          </SetupSection>

          <SetupSection number="06" title="Skills & topics" subtitle="Guide the interviewer toward the areas you want to practice.">
            <div className="tag-input">
              {config.skills.map(t => (
                <span key={t}>
                  {t}
                  <button onClick={() => update('skills', config.skills.filter(x => x !== t))}>×</button>
                </span>
              ))}
              <input
                value={skill}
                onChange={e => setSkill(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(skill);
                  }
                }}
                placeholder="Add a skill, topic, or technology..."
              />
            </div>
            <div className="suggestions">
              <small>SUGGESTED FOR YOUR ROLE</small>
              <div>
                {(suggestions[config.role] || suggestions.default).map(x => (
                  <button key={x} onClick={() => addSkill(x)}>+ {x}</button>
                ))}
              </div>
            </div>
          </SetupSection>

          <SetupSection number="07" title="Optional context" subtitle="Tell the interviewer where you'd like more attention.">
            <textarea
              className="field textarea-small"
              value={config.context}
              onChange={e => update('context', e.target.value)}
              placeholder="For example: Ask more questions about my projects, focus on SQL joins, or challenge my problem-solving..."
            />
            <div className="char-count">{config.context.length}/400</div>
          </SetupSection>
        </div>

        <aside className="summary-card card">
          <span className="eyebrow">SESSION SUMMARY</span>
          <h3>Your interview</h3>
          <SummaryRow label="Role" value={config.role || 'Not selected'} />
          <SummaryRow label="Experience" value={config.experience || 'Not selected'} />
          <SummaryRow label="Type" value={config.type || 'Not selected'} />
          <SummaryRow label="Difficulty" value={config.difficulty} />
          <SummaryRow label="Length" value={`${config.length} questions`} />
          <div className="summary-time">
            <Icon name="clock" />
            <span>
              <small>ESTIMATED TIME</small>
              <strong>About {config.length * 3} minutes</strong>
            </span>
          </div>
          {error && <p className="form-error">{error}</p>}
          <Button onClick={go} disabled={loading}>
            {loading ? 'Calibrating interview...' : 'Start interview'} <Icon name="arrow" size={17} />
          </Button>
          <button className="back-link" onClick={() => navigate('overview')}>Back to dashboard</button>
        </aside>
      </div>
    </div>
  );
}

function SetupSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="setup-section">
      <div className="setup-heading">
        <span>{number}</span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
