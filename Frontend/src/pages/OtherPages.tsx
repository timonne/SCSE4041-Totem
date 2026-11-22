import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { sessions as fallbackSessions } from '../data';
import type { Page, Session, Theme, UserSettingsData } from '../types';
import { Badge, Button, Card, Icon, PageTitle, Progress } from '../components/UI';
import { DonutChart, LineChart, RadarChart } from '../components/Visuals';

export function History({
  navigate,
  onSelectSession,
}: {
  navigate: (p: Page) => void;
  onSelectSession?: (id: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All types');
  const [sort, setSort] = useState('Newest');
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getInterviews({ search, type, sort })
      .then((data) => {
        if (!active) return;
        setSessionsList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load history from backend, using sample:', err.message);
        setSessionsList(fallbackSessions);
        setLoading(false);
      });
    return () => { active = false; };
  }, [search, type, sort]);

  const filtered = useMemo(() => {
    return sessionsList.filter(s =>
      s.role.toLowerCase().includes(search.toLowerCase()) &&
      (type === 'All types' || s.type === type)
    ).sort((a, b) =>
      sort === 'Highest score' ? b.score - a.score : sort === 'Oldest' ? a.id - b.id : b.id - a.id
    );
  }, [sessionsList, search, type, sort]);

  const totalSessions = filtered.length;
  const avgScore = totalSessions ? Math.round(filtered.reduce((sum, s) => sum + s.score, 0) / totalSessions) : 0;
  const highestScore = totalSessions ? Math.max(...filtered.map(s => s.score)) : 0;

  return (
    <div className="page">
      <PageTitle
        title="Your interview history"
        subtitle="Track your practice sessions and progress over time."
        actions={
          <Button onClick={() => navigate('setup')}>
            <Icon name="plus" size={17} /> New interview
          </Button>
        }
      />
      <div className="history-summary">
        {[
          [`${totalSessions}`, 'Total sessions'],
          [`${avgScore}`, 'Average score'],
          [`${highestScore}`, 'Highest score'],
          ['4h 25m', 'Total practice'],
        ].map(([v, l]) => (
          <Card key={l}>
            <strong>{v}</strong>
            <span>{l}</span>
          </Card>
        ))}
      </div>
      <Card>
        <div className="filters">
          <label className="search-box">
            <Icon name="search" size={18} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by role..." />
          </label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option>All types</option>
            <option>Technical</option>
            <option>Behavioral</option>
            <option>HR</option>
            <option>Mixed</option>
          </select>
          <select>
            <option>All dates</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option>Newest</option>
            <option>Oldest</option>
            <option>Highest score</option>
          </select>
        </div>

        {filtered.length > 0 ? (
          <div className="history-table">
            <div className="table-head">
              <span>JOB ROLE</span>
              <span>TYPE</span>
              <span>DIFFICULTY</span>
              <span>SCORE</span>
              <span>QUESTIONS</span>
              <span>DURATION</span>
              <span />
            </div>
            {filtered.map((s, i) => (
              <button
                className="table-row"
                key={s.id}
                onClick={() => {
                  if (onSelectSession) onSelectSession(s.id);
                  navigate('report');
                }}
              >
                <span className="table-role">
                  <i className={`role-icon role-${i % 5}`}>{s.role.slice(0, 2).toUpperCase()}</i>
                  <span>
                    <strong>{s.role}</strong>
                    <small>{s.date}</small>
                  </span>
                </span>
                <Badge tone="blue">{s.type}</Badge>
                <span>{s.difficulty}</span>
                <strong className={s.score > 80 ? 'score-high' : 'score-mid'}>
                  {s.score}<small>/100</small>
                </strong>
                <span>{s.questions}</span>
                <span>{s.duration}</span>
                <Icon name="arrow" size={17} />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-doc"><span>✓</span></div>
            <h2>Your journey starts here</h2>
            <p>Complete your first interview to start tracking your progress.</p>
            <Button onClick={() => navigate('setup')}>Start your first interview</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export function Performance({ navigate }: { navigate: (p: Page) => void }) {
  const [range, setRange] = useState('All time');
  const [progression, setProgression] = useState<number[]>([58, 64, 61, 72, 78, 84, 79, 88]);
  const [categories, setCategories] = useState<Record<string, number>>({
    'Technical Knowledge': 86,
    Communication: 82,
    'Problem-Solving': 78,
  });
  const [typeDistribution, setTypeDistribution] = useState<Array<{ type: string; percentage: string; count: number }>>([
    { type: 'Technical', percentage: '42%', count: 5 },
    { type: 'Mixed', percentage: '33%', count: 4 },
    { type: 'Behavioral', percentage: '17%', count: 2 },
    { type: 'HR', percentage: '8%', count: 1 },
  ]);
  const [totalSessions, setTotalSessions] = useState(12);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.getProgressionAnalytics(range),
      api.getCategoryAnalytics(),
      api.getInterviewTypeAnalytics(),
    ]).then(([progRes, catRes, typeRes]) => {
      if (!active) return;
      if (progRes.status === 'fulfilled' && progRes.value.scores?.length > 0) {
        setProgression(progRes.value.scores);
      }
      if (catRes.status === 'fulfilled' && catRes.value.categories) {
        setCategories(catRes.value.categories);
      }
      if (typeRes.status === 'fulfilled' && typeRes.value.distribution) {
        setTypeDistribution(typeRes.value.distribution);
        setTotalSessions(typeRes.value.total_sessions || 12);
      }
    });
    return () => { active = false; };
  }, [range]);

  const avg = progression.length ? Math.round(progression.reduce((a, b) => a + b, 0) / progression.length) : 78;
  const high = progression.length ? Math.max(...progression) : 88;
  const diff = progression.length > 1 ? progression[progression.length - 1] - progression[0] : 14;

  return (
    <div className="page">
      <PageTitle
        title="Performance analytics"
        subtitle="Understand your progress across interviews."
        actions={
          <div className="segment compact">
            {['7 days', '30 days', '90 days', 'All time'].map(x => (
              <button className={range === x ? 'active' : ''} key={x} onClick={() => setRange(x)}>
                {x}
              </button>
            ))}
          </div>
        }
      />
      <div className="history-summary">
        {[
          [`${avg}/100`, 'Average score', '+6%'],
          [`${high}`, 'Highest score', 'Top 18%'],
          [`${totalSessions}`, 'Total interviews', `+${Math.min(totalSessions, 3)}`],
          [`${diff >= 0 ? '+' : ''}${diff} pts`, 'Improvement', 'Since first'],
        ].map(([v, l, n]) => (
          <Card key={l}>
            <span>{l}</span>
            <strong>{v}</strong>
            <small>{n}</small>
          </Card>
        ))}
      </div>
      <div className="analytics-grid">
        <Card className="wide">
          <div className="section-head">
            <div>
              <h3>Score progression</h3>
              <p>Your performance across completed sessions</p>
            </div>
            <Badge tone="green">↗ {Math.abs(diff)} points</Badge>
          </div>
          <LineChart tall data={progression} />
        </Card>
        <Card>
          <div className="section-head">
            <div>
              <h3>Skill breakdown</h3>
              <p>Current proficiency profile</p>
            </div>
          </div>
          <RadarChart scores={categories} />
          <div className="radar-labels">
            <span>Technical {categories['Technical Knowledge'] || 86}</span>
            <span>Communication {categories['Communication'] || 82}</span>
            <span>Problem-solving {categories['Problem-Solving'] || 78}</span>
          </div>
        </Card>
        <Card>
          <div className="section-head">
            <div>
              <h3>Interview types</h3>
              <p>Practice distribution</p>
            </div>
          </div>
          <div className="donut-layout">
            <DonutChart count={totalSessions} />
            <div>
              {typeDistribution.map((item, i) => (
                <span key={item.type}>
                  <i className={`dot-${i % 4}`} />
                  {item.type}
                  <b>{item.percentage}</b>
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div className="insight-grid">
        {[
          ['Strongest category', 'Relevance', '91 average', 'spark'],
          ['Focus area', 'Answer depth', '74 average', 'chart'],
          ['Most improved', 'Communication', '+12 points', 'arrow'],
          ['Suggested next', 'System design', 'Hard · 10 questions', 'settings'],
        ].map(([l, t, n, icon], i) => (
          <Card key={l}>
            <i className={`insight-icon insight-${i}`}><Icon name={icon} /></i>
            <span>{l}</span>
            <h3>{t}</h3>
            <p>{n}</p>
            {i === 3 && (
              <button onClick={() => navigate('setup')}>Practice now <Icon name="arrow" size={15} /></button>
            )}
          </Card>
        ))}
      </div>
      <Card className="ai-work-card">
        <div>
          <Badge><Icon name="spark" size={13} /> PROMPT ENGINEERING</Badge>
          <h2>See how your AI interviewer thinks</h2>
          <p>
            Explore the seven-stage pipeline that turns your configuration and answers into adaptive questions and actionable feedback.
          </p>
          <Button variant="secondary" onClick={() => navigate('ai')}>
            Explore how the AI works <Icon name="arrow" size={17} />
          </Button>
        </div>
        <div className="mini-pipeline">
          {['CFG', 'Q', 'AI', 'A', 'EVAL', '↗', 'RPT'].map((x, i) => (
            <span key={i}>{x}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function SettingsPage({
  theme,
  setTheme,
  toast,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toast: (m: string) => void;
}) {
  const [prefs, setPrefs] = useState<UserSettingsData>({
    length: '10 questions',
    difficulty: 'Medium',
    type: 'Mixed',
    experience: 'Intermediate',
    detail: true,
    samples: true,
    study: true,
    reduce: false,
    contrast: false,
    size: 'Default',
    theme: theme,
  });

  // Load persisted settings on mount
  useEffect(() => {
    let active = true;
    api.getSettings().then((data) => {
      if (!active) return;
      if (data) {
        setPrefs(prev => ({ ...prev, ...data }));
        if (data.theme) setTheme(data.theme);
      }
    }).catch(() => {
      // Use defaults
    });
    return () => { active = false; };
  }, []);

  const update = (k: keyof UserSettingsData, v: any) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
  };

  const save = async () => {
    try {
      await api.updateSettings(prefs);
      toast('Settings saved');
    } catch {
      toast('Settings saved locally');
    }
  };

  return (
    <div className="page settings-page">
      <PageTitle title="Settings" subtitle="Personalize your interview and feedback experience." />
      <div className="settings-layout">
        <nav className="settings-nav">
          {['Appearance', 'Interview preferences', 'Feedback preferences', 'Accessibility', 'Account'].map((x, i) => (
            <a key={x} href={`#setting-${i}`}>{x}</a>
          ))}
        </nav>
        <div className="settings-content">
          <SettingsCard id="setting-0" title="Appearance" subtitle="Choose how InterviewAI looks on this device.">
            <div className="theme-grid">
              {(['dark', 'light', 'system'] as Theme[]).map(t => (
                <button
                  className={theme === t ? 'selected' : ''}
                  key={t}
                  onClick={() => {
                    setTheme(t);
                    update('theme', t);
                  }}
                >
                  <span className={`theme-preview ${t}`}><i /><i /><i /></span>
                  <strong>{t[0].toUpperCase() + t.slice(1)}</strong>
                  <small>{t === 'system' ? 'Match device settings' : `${t} interface`}</small>
                </button>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard id="setting-1" title="Interview preferences" subtitle="Set defaults for new practice sessions.">
            <div className="settings-fields">
              <Select
                label="Default interview length"
                value={prefs.length}
                options={['5 questions', '10 questions', '15 questions']}
                onChange={v => update('length', v)}
              />
              <Select
                label="Default difficulty"
                value={prefs.difficulty}
                options={['Easy', 'Medium', 'Hard']}
                onChange={v => update('difficulty', v)}
              />
              <Select
                label="Preferred interview type"
                value={prefs.type}
                options={['Technical', 'Behavioral', 'HR', 'Mixed']}
                onChange={v => update('type', v)}
              />
              <Select
                label="Default experience level"
                value={prefs.experience}
                options={['Beginner', 'Internship', 'Entry-Level', 'Intermediate', 'Advanced']}
                onChange={v => update('experience', v)}
              />
            </div>
          </SettingsCard>

          <SettingsCard id="setting-2" title="Feedback preferences" subtitle="Control how your assessment report is generated.">
            <Toggle
              label="Detailed feedback"
              note="Include deeper evaluation and reasoning."
              active={prefs.detail}
              onClick={() => update('detail', !prefs.detail)}
            />
            <Toggle
              label="Include sample answers"
              note="Show improved response examples."
              active={prefs.samples}
              onClick={() => update('samples', !prefs.samples)}
            />
            <Toggle
              label="Study recommendations"
              note="Add personalized topics and next steps."
              active={prefs.study}
              onClick={() => update('study', !prefs.study)}
            />
          </SettingsCard>

          <SettingsCard id="setting-3" title="Accessibility" subtitle="Adjust the interface to your needs.">
            <Toggle
              label="Reduce animations"
              note="Minimize motion throughout the app."
              active={prefs.reduce}
              onClick={() => {
                const next = !prefs.reduce;
                update('reduce', next);
                document.documentElement.classList.toggle('reduce-motion', next);
              }}
            />
            <Toggle
              label="High contrast"
              note="Increase text and border contrast."
              active={prefs.contrast}
              onClick={() => {
                const next = !prefs.contrast;
                update('contrast', next);
                document.documentElement.classList.toggle('high-contrast', next);
              }}
            />
            <div className="setting-row">
              <span>
                <strong>Text size</strong>
                <small>Adjust interface text scaling.</small>
              </span>
              <div className="segment compact">
                {['Small', 'Default', 'Large'].map(x => (
                  <button
                    className={prefs.size === x ? 'active' : ''}
                    onClick={() => {
                      update('size', x);
                      document.documentElement.dataset.textSize = x;
                    }}
                    key={x}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          </SettingsCard>

          <SettingsCard id="setting-4" title="Account" subtitle="Your prototype profile information.">
            <div className="account-card">
              <span className="avatar big">AM</span>
              <div>
                <strong>Alex Morgan</strong>
                <p>alex.morgan@example.com</p>
                <Badge tone="violet">INTERVIEW CANDIDATE</Badge>
              </div>
              <Button variant="secondary" onClick={() => toast('Profile changes saved')}>Edit profile</Button>
            </div>
          </SettingsCard>

          <Button onClick={save}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

export function Help({ toast }: { toast: (m: string) => void }) {
  const [open, setOpen] = useState(0);
  const [mode, setMode] = useState<'feedback' | 'bug'>('feedback');
  const faqs = [
    ['How the application works', 'Choose your target role and preferences, answer one question at a time, then receive a detailed assessment with next steps.'],
    ['How scoring is calculated', 'Responses are evaluated for relevance, clarity, depth, technical accuracy, communication, and problem-solving.'],
    ['Tips for better practice', 'Think aloud, use concrete examples, structure behavioral answers with STAR, and explain the reasoning behind decisions.'],
  ];

  return (
    <div className="page">
      <PageTitle title="Help & feedback" subtitle="Find answers, improve your practice, or tell us what you think." />
      <div className="help-hero card">
        <Badge><Icon name="help" size={14} /> SUPPORT CENTER</Badge>
        <h2>How can we help?</h2>
        <p>Everything you need to get the most from your interview practice.</p>
      </div>
      <div className="help-grid">
        <Card>
          <h3>Common questions</h3>
          <div className="faq-list">
            {faqs.map(([q, a], i) => (
              <div className={open === i ? 'open' : ''} key={q}>
                <button onClick={() => setOpen(open === i ? -1 : i)}>
                  <strong>{q}</strong>
                  <Icon name="chevron" />
                </button>
                {open === i && <p>{a}</p>}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="segment large two">
            <button className={mode === 'feedback' ? 'active' : ''} onClick={() => setMode('feedback')}>Share feedback</button>
            <button className={mode === 'bug' ? 'active' : ''} onClick={() => setMode('bug')}>Report a bug</button>
          </div>
          <label className="form-label">Subject<input className="field" placeholder={mode === 'bug' ? 'What went wrong?' : 'What would you like to share?'} /></label>
          <label className="form-label">Details<textarea className="field" placeholder="Tell us a little more..." /></label>
          <label className="form-label">Email (optional)<input className="field" type="email" placeholder="you@example.com" /></label>
          <Button onClick={() => toast(mode === 'bug' ? 'Bug report submitted' : 'Thanks for your feedback')}>
            Send {mode === 'bug' ? 'report' : 'feedback'}
          </Button>
        </Card>
      </div>
    </div>
  );
}

const pipeline = [
  ['User configuration', 'Role, level, skills, interview type', 'Creates a structured interview brief'],
  ['Question generation', 'Interview brief + question history', 'A relevant, calibrated question'],
  ['Interviewer', 'Question + conversation state', 'Natural one-question-at-a-time flow'],
  ['User answer', 'Candidate response + timing', 'Structured answer context'],
  ['Answer evaluation', 'Answer + role-specific rubric', 'Evidence-based score and feedback'],
  ['Adaptive follow-up', 'Gaps + confidence signals', 'A targeted follow-up question'],
  ['Final report', 'All evaluations + trends', 'Performance summary and practice plan'],
];

export function AIWorks() {
  const [selected, setSelected] = useState(0);
  const [version, setVersion] = useState<'v1' | 'v2' | 'v3'>('v3');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runSampleTest = async () => {
    setTesting(true);
    try {
      const res = await api.testPrompt(
        version,
        'Software Developer',
        'How would you explain the difference between a process and a thread?',
        'A process has its own isolated memory space. Threads share memory within the same process. I would choose threads for lightweight concurrent tasks with shared state, and processes when fault isolation or security boundaries matter.'
      );
      setTestResult(res.evaluation_result);
    } catch (e: any) {
      console.warn('Prompt test call failed:', e.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="page">
      <PageTitle
        title="How the AI works"
        subtitle="Explore the prompt engineering pipeline behind every adaptive interview."
        actions={
          <div className="segment compact">
            {(['v1', 'v2', 'v3'] as const).map(v => (
              <button key={v} onClick={() => setVersion(v)} className={version === v ? 'active' : ''}>
                {v}
              </button>
            ))}
          </div>
        }
      />
      <Card className="pipeline-card">
        <div className="pipeline">
          {pipeline.map(([title], i) => (
            <div key={title}>
              <button className={selected === i ? 'active' : ''} onClick={() => setSelected(i)}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <strong>{title}</strong>
              </button>
              {i < pipeline.length - 1 && <i>→</i>}
            </div>
          ))}
        </div>
        <div className="pipeline-detail">
          <div>
            <span className="eyebrow">STAGE {selected + 1}</span>
            <h2>{pipeline[selected][0]}</h2>
            <p>This stage keeps the interview grounded in the candidate’s context while maintaining a consistent, fair evaluation process.</p>
          </div>
          <dl>
            <div>
              <dt>INFORMATION RECEIVED</dt>
              <dd>{pipeline[selected][1]}</dd>
            </div>
            <div>
              <dt>PROMPT STRATEGY</dt>
              <dd>
                {version === 'v1'
                  ? 'Basic role instruction (baseline)'
                  : version === 'v2'
                    ? 'Rubric-based scoring instruction (6-dimension evaluation)'
                    : 'Context-aware rubric with full conversation memory and trajectory tracking'}
              </dd>
            </div>
            <div>
              <dt>OUTPUT</dt>
              <dd>{pipeline[selected][2]}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="comparison-grid">
        <Card>
          <span className="eyebrow">PROMPT EVOLUTION</span>
          <h3>{version.toUpperCase()} — {version === 'v1' ? 'Basic prompt' : version === 'v2' ? 'Rubric-based' : 'Context-aware'}</h3>
          <div className="prompt-code">
            <span>SYSTEM PROMPT</span>
            <p>
              {version === 'v1'
                ? '“You are a professional mock interviewer for the role of {role}. Maintain professional demeanor and ask role-relevant questions one at a time.”'
                : version === 'v2'
                  ? '“You are an experienced technical interviewer for a {experience} {role}. Evaluate responses objectively against an explicit 6-dimension rubric (Technical accuracy, Relevance, Clarity, Depth, Problem-solving, Communication).”'
                  : '“You are an elite Senior Interviewer and Bar Raiser for {role}. Evaluate with continuous performance trajectory tracking, dynamic difficulty calibration, and context-aware adaptive follow-ups.”'}
            </p>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Button variant="secondary" onClick={runSampleTest} disabled={testing}>
              {testing ? 'Evaluating sample...' : `Run live test with ${version.toUpperCase()}`}
            </Button>
          </div>
          {testResult && (
            <div style={{ marginTop: '14px', padding: '12px', background: 'var(--elevated)', borderRadius: '8px', fontSize: '11px' }}>
              <strong>Evaluation Output ({version.toUpperCase()}):</strong>
              <div style={{ marginTop: '4px', color: 'var(--secondary)' }}>
                Score: <strong style={{ color: 'var(--text)' }}>{testResult.overall_score || 82}/100</strong>
              </div>
              <div style={{ marginTop: '4px', color: 'var(--secondary)' }}>
                Feedback: <span>{testResult.feedback || testResult.summary}</span>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <span className="eyebrow">QUALITY IMPACT</span>
          <h3>Prompt comparison</h3>
          {[
            ['Question relevance', version === 'v1' ? 62 : version === 'v2' ? 81 : 94],
            ['Feedback consistency', version === 'v1' ? 55 : version === 'v2' ? 86 : 92],
            ['Adaptive depth', version === 'v1' ? 38 : version === 'v2' ? 67 : 91],
          ].map(([x, v]) => (
            <div className="quality-row" key={x}>
              <div><span>{x}</span><strong>{v}%</strong></div>
              <Progress value={Number(v)} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function SettingsCard({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="settings-card">
      <div id={id} className="section-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="form-label">
      {label}
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(x => <option key={x}>{x}</option>)}
      </select>
    </label>
  );
}

function Toggle({
  label,
  note,
  active,
  onClick,
}: {
  label: string;
  note: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className="setting-row">
      <span>
        <strong>{label}</strong>
        <small>{note}</small>
      </span>
      <button className={`toggle ${active ? 'active' : ''}`} onClick={onClick}>
        <i />
      </button>
    </div>
  );
}
