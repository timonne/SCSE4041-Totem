import type { Question, Session } from './types';

export const roles = ['Software Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'Data Scientist', 'AI / ML Engineer', 'DevOps Engineer', 'Cybersecurity Analyst', 'UI/UX Designer', 'Product Manager', 'Business Analyst', 'Other'];

export const sessions: Session[] = [
  { id: 1, role: 'Frontend Developer', date: 'Nov 21, 2026', type: 'Technical', difficulty: 'Medium', score: 84, questions: 10, duration: '32m' },
  { id: 2, role: 'Data Analyst', date: 'Nov 19, 2026', type: 'Mixed', difficulty: 'Medium', score: 76, questions: 10, duration: '28m' },
  { id: 3, role: 'Software Engineer Intern', date: 'Nov 16, 2026', type: 'Behavioral', difficulty: 'Easy', score: 69, questions: 5, duration: '18m' },
  { id: 4, role: 'AI / ML Engineer', date: 'Nov 14, 2026', type: 'Technical', difficulty: 'Hard', score: 88, questions: 15, duration: '47m' },
  { id: 5, role: 'Backend Developer', date: 'Nov 12, 2026', type: 'Mixed', difficulty: 'Hard', score: 72, questions: 10, duration: '35m' },
];

export const questionBank: Record<string, Question[]> = {
  'Data Analyst': [
    { text: 'How would you investigate a sudden drop in weekly customer retention?', category: 'ANALYTICAL' },
    { text: 'Explain the difference between a LEFT JOIN and an INNER JOIN with a practical example.', category: 'TECHNICAL' },
    { text: 'How do you communicate a counterintuitive data finding to a non-technical stakeholder?', category: 'COMMUNICATION' },
    { text: 'Describe how you would validate a dashboard before sharing it with leadership.', category: 'QUALITY' },
  ],
  default: [
    { text: 'Tell me about a technically challenging project and the decisions you made to deliver it.', category: 'EXPERIENCE' },
    { text: 'How would you explain the difference between a process and a thread, and when would you choose one over the other?', category: 'TECHNICAL' },
    { text: 'Describe a time you received difficult feedback. How did you respond?', category: 'BEHAVIORAL' },
    { text: 'How do you approach debugging an issue that cannot be reproduced consistently?', category: 'PROBLEM SOLVING' },
    { text: 'What trade-offs would you consider when designing a system expected to scale quickly?', category: 'SYSTEM DESIGN' },
    { text: 'How do you balance delivery speed with code quality?', category: 'ENGINEERING' },
    { text: 'Tell me about a disagreement with a teammate and how you resolved it.', category: 'COLLABORATION' },
    { text: 'How do you keep your technical knowledge current?', category: 'GROWTH' },
    { text: 'Walk me through how you would prioritize multiple high-impact bugs.', category: 'DECISION MAKING' },
    { text: 'Why does this role align with the next step in your career?', category: 'MOTIVATION' },
    { text: 'What assumptions in your approach would you validate first?', category: 'FOLLOW-UP', followUp: true },
    { text: 'How would your solution change under severe time or resource constraints?', category: 'FOLLOW-UP', followUp: true },
    { text: 'What metrics would tell you that your solution is working?', category: 'IMPACT' },
    { text: 'What is one project you would redesign today, and why?', category: 'REFLECTION' },
    { text: 'What questions would you ask before beginning an ambiguous assignment?', category: 'COMMUNICATION' },
  ],
};

export const reviewQuestions = [
  {
    q: 'How would you explain the difference between a process and a thread?',
    score: 88,
    answer: 'A process has its own memory space, while threads share memory within a process. I would use threads for concurrent work with shared state and separate processes where isolation is more important.',
    feedback: 'A concise, accurate explanation with a useful decision criterion. Adding a concrete production example would make it more memorable.',
    good: ['Correct distinction between memory models', 'Explained an appropriate trade-off'],
    missing: ['Context switching overhead', 'A practical example'],
    improved: 'A process is an independently executing program with its own address space, while threads are execution units inside a process that share memory and resources. I would choose threads for lightweight concurrent tasks that need fast communication, such as handling UI work, and processes when fault isolation or security boundaries matter, such as browser tabs.',
  },
  {
    q: 'Describe a time you received difficult feedback.',
    score: 81,
    answer: 'My lead told me my updates were too technical for stakeholders. I asked for examples, adapted my weekly notes around outcomes and risks, and checked in after two weeks.',
    feedback: 'Strong ownership and a clear action. The outcome could be quantified more explicitly.',
    good: ['Demonstrated openness', 'Took a specific corrective action'],
    missing: ['Measurable business outcome'],
    improved: 'When my lead explained that my updates were too technical, I asked for examples and learned stakeholders needed decisions, risks, and outcomes. I restructured weekly updates around those three areas and requested a follow-up review. Within a month, clarification questions dropped and decisions were made faster.',
  },
  {
    q: 'How do you debug an issue that cannot be reproduced consistently?',
    score: 76,
    answer: 'I collect logs, compare environments, narrow down variables, and add instrumentation around likely failure points.',
    feedback: 'The approach is sound but would benefit from a more explicit hypothesis-driven sequence.',
    good: ['Started with evidence', 'Included observability'],
    missing: ['Prioritization strategy', 'Rollback or mitigation plan'],
    improved: 'I first define the impact and create a safe mitigation. Then I compare successful and failed requests across environment, timing, input, and dependency data. I form one hypothesis at a time, add targeted instrumentation, and use correlation IDs to trace execution. Once reproduced, I add a regression test before shipping the fix.',
  },
];
