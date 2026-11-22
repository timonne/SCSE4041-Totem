import { questionBank } from './data';
import type { Answer, InterviewConfig, Question } from './types';

export function generateQuestions(config: InterviewConfig): Question[] {
  const base = questionBank[config.role] || questionBank.default;
  const pool = [...base, ...questionBank.default];
  return Array.from({ length: config.length }, (_, index) => {
    const question = pool[index % pool.length];
    return index === 2 && config.length > 5
      ? { ...questionBank.default[10], followUp: true }
      : { ...question };
  });
}

export function evaluateAnswer(question: Question, text: string): Answer {
  const words = text.trim().split(/\s+/).length;
  const structure = /(first|then|because|for example|result|finally|however)/i.test(text);
  const relevantTerms = /(process|thread|project|team|data|system|user|result|problem|solution|feedback|example)/gi;
  const relevance = (text.match(relevantTerms) || []).length;
  let score = 42 + Math.min(words, 90) * 0.35 + (structure ? 10 : 0) + Math.min(relevance * 3, 15);
  if (/i don'?t know|not sure/i.test(text)) score = Math.min(score, 48);
  score = Math.round(Math.min(94, score));
  return {
    question,
    text,
    score,
    feedback: score >= 80
      ? 'Strong response: clear, relevant, and supported by useful reasoning.'
      : score >= 60
        ? 'A relevant foundation. Add a concrete example and make your reasoning more explicit.'
        : 'The response needs more detail and a clearer connection to the question.',
  };
}
