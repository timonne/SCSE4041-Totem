import { useEffect, useState } from 'react';
import { AppShell } from './components/Layout';
import { Toast } from './components/UI';
import { Overview, Setup } from './pages/DashboardSetup';
import { Interview, Report } from './pages/InterviewReport';
import { AIWorks, Help, History, Performance, SettingsPage } from './pages/OtherPages';
import type { Answer, InterviewConfig, Page, Theme } from './types';

const initialConfig: InterviewConfig = {
  role: 'Software Developer',
  experience: 'Intermediate',
  type: 'Mixed',
  difficulty: 'Medium',
  length: 10,
  skills: ['JavaScript', 'React', 'DSA'],
  context: '',
};

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    const saved = localStorage.getItem('interview-page') as Page;
    return saved && saved !== 'interview' ? saved : 'overview';
  });
  const [config, setConfig] = useState(initialConfig);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [activeInterviewId, setActiveInterviewId] = useState<number | null>(() => {
    const id = localStorage.getItem('active-interview-id');
    return id ? parseInt(id, 10) : null;
  });
  const [selectedReportId, setSelectedReportId] = useState<number | null>(() => {
    const id = localStorage.getItem('selected-report-id');
    return id ? parseInt(id, 10) : null;
  });
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('interview-theme') as Theme) || 'dark');
  const [toast, setToast] = useState('');

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem('interview-theme', next);
  };

  useEffect(() => {
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;
    document.documentElement.dataset.theme = resolved;
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = (next: Page) => {
    setPage(next);
    localStorage.setItem('interview-page', next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartInterview = (createdId?: number) => {
    if (createdId) {
      setActiveInterviewId(createdId);
      setSelectedReportId(createdId);
      localStorage.setItem('active-interview-id', createdId.toString());
      localStorage.setItem('selected-report-id', createdId.toString());
    }
    navigate('interview');
  };

  const handleFinishInterview = (result: Answer[], completedId?: number) => {
    setAnswers(result);
    const targetId = completedId || activeInterviewId;
    if (targetId) {
      setSelectedReportId(targetId);
      localStorage.setItem('selected-report-id', targetId.toString());
    }
    localStorage.removeItem('active-interview-id');
    setActiveInterviewId(null);
    navigate('report');
  };

  const handleSelectSession = (sessionId: number) => {
    setSelectedReportId(sessionId);
    localStorage.setItem('selected-report-id', sessionId.toString());
  };

  if (page === 'interview') {
    return (
      <>
        <Interview
          config={config}
          interviewId={activeInterviewId}
          onExit={() => navigate('overview')}
          onFinish={handleFinishInterview}
        />
        <Toast message={toast} />
      </>
    );
  }

  const content = {
    overview: <Overview navigate={navigate} onSelectSession={handleSelectSession} />,
    setup: (
      <Setup
        config={config}
        setConfig={setConfig}
        start={handleStartInterview}
        navigate={navigate}
      />
    ),
    history: <History navigate={navigate} onSelectSession={handleSelectSession} />,
    performance: <Performance navigate={navigate} />,
    settings: <SettingsPage theme={theme} setTheme={setTheme} toast={setToast} />,
    help: <Help toast={setToast} />,
    ai: <AIWorks />,
    report: (
      <Report
        config={config}
        answers={answers}
        interviewId={selectedReportId}
        navigate={navigate}
        retake={() => navigate('setup')}
        toast={setToast}
      />
    ),
    interview: null,
  }[page];

  return (
    <AppShell page={page} onNavigate={navigate}>
      {content}
      <Toast message={toast} />
    </AppShell>
  );
}
