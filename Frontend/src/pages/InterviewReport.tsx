import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { reviewQuestions as fallbackReviews } from '../data';
import { evaluateAnswer, generateQuestions } from '../mockAi';
import type { Answer, InterviewConfig, Page, Question, ReportData } from '../types';
import { Badge, Button, Card, Icon, PageTitle, Progress } from '../components/UI';
import { CompletionGraphic, Orb, ScoreRing } from '../components/Visuals';

export function Interview({
  config,
  interviewId,
  onFinish,
  onExit,
}: {
  config: InterviewConfig;
  interviewId?: number | null;
  onFinish: (answers: Answer[], completedInterviewId?: number) => void;
  onExit: () => void;
}) {
  const fallbackQuestions = useMemo(() => generateQuestions(config), [config]);
  const [questions, setQuestions] = useState<Question[]>(fallbackQuestions);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [state, setState] = useState<'ready' | 'thinking' | 'complete'>('ready');
  const [seconds, setSeconds] = useState(0);
  const [submitted, setSubmitted] = useState('');
  const [currentId, setCurrentId] = useState<number | null>(interviewId || null);

  // Load questions and active session from backend if interviewId exists
  useEffect(() => {
    if (!currentId) return;
    let active = true;

    api.getInterview(currentId).then((data) => {
      if (!active) return;
      if (data && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setIndex(data.current_question_index || 0);
      }
    }).catch((err) => {
      console.warn('Could not sync interview from backend, using local questions:', err.message);
    });

    return () => { active = false; };
  }, [currentId]);

  useEffect(() => {
    if (state === 'complete') return;
    const timer = window.setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);

  const format = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const advance = async (text: string, skipped = false) => {
    if (!text.trim() && !skipped) return;

    const currentQ = questions[index] || fallbackQuestions[0];
    const answerText = skipped ? 'Question skipped' : text;
    setSubmitted(skipped ? 'Question skipped' : text);
    setState('thinking');
    setAnswer('');

    // If connected to backend interview
    if (currentId && currentQ.id) {
      try {
        const result = skipped
          ? await api.skipQuestion(currentId)
          : await api.submitAnswer(currentId, currentQ.id, answerText, seconds);

        const newAnswer: Answer = {
          question: currentQ,
          text: answerText,
          score: result.evaluation ? Math.round(result.evaluation.overall_score) : 75,
          feedback: result.evaluation ? result.evaluation.feedback : 'Answer evaluated.',
          evaluation: result.evaluation,
        };
        setAnswers(a => [...a, newAnswer]);

        window.setTimeout(() => {
          if (result.completed || !result.next_question) {
            setState('complete');
          } else {
            // If follow-up or next question returned
            if (result.is_follow_up && result.next_question) {
              setQuestions(prev => {
                const updated = [...prev];
                updated.splice(index + 1, 0, result.next_question!);
                return updated;
              });
            }
            setIndex(i => i + 1);
            setSubmitted('');
            setState('ready');
          }
        }, 1200);
        return;
      } catch (err: any) {
        console.warn('Backend evaluation failed, falling back locally:', err.message);
      }
    }

    // Local fallback evaluation
    const response = evaluateAnswer(currentQ, skipped ? 'I’m not sure how to answer this question yet.' : text);
    setAnswers(a => [...a, response]);
    window.setTimeout(() => {
      if (index + 1 >= questions.length) {
        setState('complete');
      } else {
        setIndex(i => i + 1);
        setSubmitted('');
        setState('ready');
      }
    }, 1200);
  };

  const endEarly = async () => {
    if (currentId) {
      try {
        await api.endInterview(currentId);
      } catch (err: any) {
        console.warn('End interview API failed:', err.message);
      }
    }
    setState('complete');
  };

  if (state === 'complete') {
    return (
      <div className="interview-shell completion-screen">
        <CompletionGraphic />
        <span className="eyebrow">EVALUATION COMPLETE</span>
        <h1>Interview completed</h1>
        <p>Your responses have been evaluated. Your personalized performance report is ready.</p>
        <div className="completion-summary">
          <span><small>ROLE</small><strong>{config.role}</strong></span>
          <span><small>QUESTIONS</small><strong>{questions.length}</strong></span>
          <span><small>DURATION</small><strong>{format}</strong></span>
        </div>
        <Button onClick={() => onFinish(answers, currentId || undefined)}>
          View performance report <Icon name="arrow" size={17} />
        </Button>
        <button className="back-link" onClick={onExit}>Back to dashboard</button>
      </div>
    );
  }

  const q = questions[index] || fallbackQuestions[0];
  const progressPercent = Math.min(100, Math.round(((index + 1) / questions.length) * 100));

  return (
    <div className="interview-shell">
      <header className="interview-header">
        <button className="icon-button" onClick={onExit} aria-label="Exit interview"><Icon name="exit" /></button>
        <div className="interview-title">
          <strong>{config.role}</strong>
          <span>
            <Badge>{config.type}</Badge>
            <Badge tone="neutral">{q.difficulty || config.difficulty}</Badge>
          </span>
        </div>
        <div className="interview-progress-label">
          <span>Question {index + 1} of {questions.length}</span>
          <strong>{progressPercent}%</strong>
        </div>
        <div className="timer"><Icon name="clock" size={18} />{format}</div>
        <Button variant="danger" onClick={endEarly}>End interview</Button>
      </header>

      <div className="interview-track">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <main className="interview-workspace">
        <section className={`interviewer-panel ${state}`}>
          <span className="eyebrow">AI INTERVIEWER</span>
          <Orb state={state === 'thinking' ? 'thinking' : 'idle'} />
          <div className="ai-status">
            <i />
            <strong>{state === 'thinking' ? 'Analyzing your response' : 'Ready for your response'}</strong>
            <p>{state === 'thinking' ? 'Evaluating clarity, relevance, and technical depth' : 'Take your time. I’m listening.'}</p>
          </div>
          {state === 'thinking' && (
            <div className="pulse-bars">
              {[1, 2, 3, 4, 5, 6, 7].map(i => <i key={i} />)}
            </div>
          )}
          <div className="ai-note">
            <Icon name="spark" size={16} />
            <span>
              <strong>Adaptive interview</strong>
              <small>Questions evolve based on your responses.</small>
            </span>
          </div>
        </section>

        <section className="question-panel">
          <div className="question-meta">
            <span>QUESTION {String(index + 1).padStart(2, '0')}</span>
            <div>
              <Badge tone={q.followUp ? 'amber' : 'blue'}>{q.followUp ? 'FOLLOW-UP' : q.category}</Badge>
              <Badge tone="neutral">{(q.difficulty || config.difficulty).toUpperCase()}</Badge>
            </div>
          </div>
          <h1>{q.text}</h1>
          {q.followUp && (
            <p className="question-context">
              Based on your previous response, I’d like to explore your reasoning in more depth.
            </p>
          )}

          {submitted && (
            <div className="submitted-answer">
              <span>YOUR RESPONSE</span>
              <p>{submitted}</p>
            </div>
          )}

          {!submitted && (
            <div className="answer-editor">
              <textarea
                autoFocus
                disabled={state === 'thinking'}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => {
                  if (e.ctrlKey && e.key === 'Enter') advance(answer);
                }}
                placeholder="Take your time and structure your response..."
              />
              <div className="editor-bottom">
                <span>{answer.length} characters</span>
                <button onClick={() => setAnswer('')} disabled={state === 'thinking'}>Clear</button>
              </div>
            </div>
          )}

          <p className="privacy-note">
            Your responses are evaluated after submission. Feedback will be provided at the end of the interview.
          </p>

          <div className="interview-controls">
            {!submitted && (
              <>
                <Button variant="secondary" onClick={() => advance('', true)}>I’m not sure</Button>
                <Button variant="ghost" onClick={() => advance('', true)}>Skip question</Button>
                <Button disabled={!answer.trim() || state === 'thinking'} onClick={() => advance(answer)}>
                  Submit answer <span className="shortcut">Ctrl ↵</span>
                </Button>
              </>
            )}
            {state === 'thinking' && (
              <div className="analysis-label">
                <span /><span /><span /> Analyzing response
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export function Report({
  config,
  answers,
  interviewId,
  navigate,
  retake,
  toast,
}: {
  config: InterviewConfig;
  answers: Answer[];
  interviewId?: number | null;
  navigate: (p: Page) => void;
  retake: () => void;
  toast: (m: string) => void;
}) {
  const [open, setOpen] = useState(0);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch report from backend if interviewId is present
  useEffect(() => {
    if (!interviewId) return;
    let active = true;
    setLoading(true);

    api.getReport(interviewId)
      .then((data) => {
        if (!active) return;
        setReportData(data);
        setLoading(false);
      })
      .catch(() => {
        // If not generated yet, call generateReport
        api.generateReport(interviewId)
          .then((data) => {
            if (!active) return;
            setReportData(data);
            setLoading(false);
          })
          .catch((err) => {
            console.warn('Could not load report from backend:', err.message);
            setLoading(false);
          });
      });

    return () => { active = false; };
  }, [interviewId]);

  const average = reportData
    ? reportData.overall_score
    : (answers.length ? Math.round(answers.reduce((a, b) => a + b.score, 0) / answers.length) : 84);

  const reviews = reportData?.reviews && reportData.reviews.length > 0
    ? reportData.reviews
    : (answers.length
        ? answers.map((a, i) => ({
            ...fallbackReviews[i % fallbackReviews.length],
            q: a.question.text,
            answer: a.text,
            score: a.score,
            feedback: a.feedback,
            good: a.evaluation?.strengths || fallbackReviews[i % fallbackReviews.length].good,
            missing: a.evaluation?.missing_concepts || fallbackReviews[i % fallbackReviews.length].missing,
            improved: a.evaluation?.improved_answer || fallbackReviews[i % fallbackReviews.length].improved,
          }))
        : fallbackReviews);

  const categoryScores = reportData?.category_scores || {
    'Technical Knowledge': 86,
    Communication: 82,
    'Problem-Solving': 78,
    Relevance: 91,
    Depth: 74,
    Clarity: 88,
  };

  const strengths = reportData?.strengths || [
    ['Clear explanations', 'You explained core concepts using understandable language.'],
    ['Strong relevance', 'Most responses stayed focused on the question.'],
    ['Technical fundamentals', 'You showed solid knowledge of fundamental concepts.'],
  ];

  const focusAreas = reportData?.areas_for_improvement || [
    ['Answer depth', 'Expand on your reasoning and add practical examples.'],
    ['Scenario-based reasoning', 'Practice approaching unfamiliar situations.'],
    ['Answer structure', 'Use concept, reasoning, example, conclusion.'],
  ];

  const nextSteps = reportData?.next_steps || [
    { num: '01', title: 'Strengthen technical fundamentals', priority: 'HIGH PRIORITY', desc: 'Review operating systems, DBMS, and networking concepts.' },
    { num: '02', title: 'Practice structured responses', priority: 'RECOMMENDED', desc: 'Use a clear beginning, explanation, and practical example.' },
    { num: '03', title: 'Try a harder interview', priority: 'NEXT UP', desc: 'Challenge yourself with scenario-based questions.' },
  ];

  const copy = (text: string) =>
    navigator.clipboard?.writeText(text).then(() => toast('Improved answer copied'));

  return (
    <div className="page report-page">
      <PageTitle
        title="Interview Report"
        subtitle="Here’s how you performed and where you can improve."
        actions={
          <>
            <Button variant="secondary" onClick={() => toast('Report prepared for download')}>
              <Icon name="download" size={17} /> Download report
            </Button>
            <Button onClick={retake}>Retake interview</Button>
          </>
        }
      />

      <Card className="report-hero">
        <div className="report-score">
          <ScoreRing score={average} size={190} />
          <div>
            <Badge tone="green">{average >= 80 ? 'STRONG PERFORMANCE' : average >= 65 ? 'SOLID PERFORMANCE' : 'NEEDS PRACTICE'}</Badge>
            <h2>{average >= 80 ? 'A confident performance with clear potential.' : 'A solid foundation with targeted areas for growth.'}</h2>
            <p>{reportData?.summary || 'You demonstrated solid technical knowledge and clear communication, with room to improve depth in scenario-based reasoning.'}</p>
          </div>
        </div>
        <div className="report-meta">
          {[
            ['ROLE', config.role],
            ['INTERVIEW TYPE', config.type],
            ['DIFFICULTY', config.difficulty],
            ['QUESTIONS', `${reportData?.completion_stats?.total_questions || config.length} questions`],
            ['DURATION', reportData?.completion_stats?.duration || '32 minutes'],
            ['DATE', 'Nov 22, 2026'],
          ].map(([l, v]) => (
            <span key={l}>
              <small>{l}</small>
              <strong>{v}</strong>
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <div className="section-head">
          <div>
            <span className="eyebrow">SCORE BREAKDOWN</span>
            <h3>Performance by category</h3>
            <p>A detailed view of the skills evaluated in this interview.</p>
          </div>
        </div>
        <div className="breakdown-grid">
          {Object.entries(categoryScores).map(([label, val]) => (
            <div className="breakdown" key={label}>
              <div>
                <strong>{label}</strong>
                <span>{val}</span>
              </div>
              <Progress value={Number(val)} />
              <small>{Number(val) > 85 ? 'Excellent' : Number(val) > 78 ? 'Strong' : 'Developing'} performance</small>
            </div>
          ))}
        </div>
      </Card>

      <div className="feedback-grid">
        <FeedbackSection title="What you did well" tone="good" items={strengths} />
        <FeedbackSection title="Areas to focus on" tone="focus" items={focusAreas} />
      </div>

      <Card>
        <div className="section-head">
          <div>
            <span className="eyebrow">DETAILED REVIEW</span>
            <h3>Question-by-question feedback</h3>
            <p>Explore your answers, evaluation, and stronger response examples.</p>
          </div>
        </div>
        <div className="review-list">
          {reviews.map((r, i) => (
            <div className={`review-item ${open === i ? 'open' : ''}`} key={i}>
              <button onClick={() => setOpen(open === i ? -1 : i)}>
                <span className="question-number">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <small>TECHNICAL · {config.difficulty.toUpperCase()}</small>
                  <strong>{r.q}</strong>
                </span>
                <b className={r.score >= 80 ? 'high' : 'medium'}>{r.score}</b>
                <Icon name="chevron" />
              </button>
              {open === i && (
                <div className="review-content">
                  <ReviewBlock title="Your answer"><p>{r.answer}</p></ReviewBlock>
                  <ReviewBlock title="AI evaluation"><p>{r.feedback}</p></ReviewBlock>
                  <div className="review-columns">
                    <ReviewBlock title="What you did well">
                      {r.good && r.good.length > 0 ? (
                        r.good.map(x => <p className="check-line" key={x}>✓ {x}</p>)
                      ) : (
                        <p className="check-line">✓ Addressed the required scenario</p>
                      )}
                    </ReviewBlock>
                    <ReviewBlock title="What was missing">
                      {r.missing && r.missing.length > 0 ? (
                        r.missing.map(x => <p className="missing-line" key={x}>− {x}</p>)
                      ) : (
                        <p className="missing-line">− Additional production trade-offs</p>
                      )}
                    </ReviewBlock>
                  </div>
                  <div className="improved-answer">
                    <div>
                      <span>Suggested improved answer</span>
                      <button onClick={() => copy(r.improved)}>
                        <Icon name="copy" size={16} /> Copy answer
                      </button>
                    </div>
                    <p>{r.improved}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="next-steps">
        <div className="section-head">
          <div>
            <span className="eyebrow">PERSONALIZED PLAN</span>
            <h3>Your next steps</h3>
            <p>Three focused actions to improve your next performance.</p>
          </div>
        </div>
        <div className="steps-grid">
          {nextSteps.map((step) => (
            <div key={step.num}>
              <span>{step.num}</span>
              <Badge tone={step.num === '01' ? 'amber' : 'neutral'}>{step.priority}</Badge>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
              <button onClick={() => navigate('setup')}>Practice now <Icon name="arrow" size={15} /></button>
            </div>
          ))}
        </div>
      </Card>

      <div className="bottom-cta">
        <div>
          <span className="eyebrow">KEEP IMPROVING</span>
          <h2>Ready to try again?</h2>
          <p>Every focused session moves you closer to your goal.</p>
        </div>
        <div>
          <Button variant="secondary" onClick={() => navigate('overview')}>Back to dashboard</Button>
          <Button onClick={() => navigate('setup')}>Start another interview <Icon name="arrow" size={17} /></Button>
        </div>
      </div>
    </div>
  );
}

function FeedbackSection({ title, tone, items }: { title: string; tone: string; items: string[][] }) {
  return (
    <Card className={`feedback-section ${tone}`}>
      <h3>{title}</h3>
      {items.map(([a, b]) => (
        <div key={a}>
          <span>{tone === 'good' ? '✓' : '↗'}</span>
          <p><strong>{a}</strong><small>{b}</small></p>
        </div>
      ))}
    </Card>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="review-block">
      <span>{title}</span>
      {children}
    </div>
  );
}
