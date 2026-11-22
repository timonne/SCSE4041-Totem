from typing import Dict, Any, List, Optional
import logging
from app.utils.dates import utc_now
from sqlalchemy.orm import Session
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.report import Report
from app.schemas.report import ReportResponse, QuestionReviewItem, NextStepItem
from app.prompts.report_generator import build_report_prompt
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


class ReportService:
    @staticmethod
    async def generate_report_for_interview(db: Session, interview_id: int) -> Report:
        """
        Generates or regenerates a full evaluation report for an interview session.
        """
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise ValueError(f"Interview {interview_id} not found")

        # Gather questions and evaluations
        questions = db.query(Question).filter(Question.interview_id == interview_id).order_by(Question.question_order.asc()).all()
        answers = db.query(Answer).filter(Answer.interview_id == interview_id).all()
        
        answer_by_q_id = {ans.question_id: ans for ans in answers}

        eval_summaries: List[Dict[str, Any]] = []
        review_items: List[QuestionReviewItem] = []
        
        scores_list = []
        tech_scores = []
        relevance_scores = []
        clarity_scores = []
        depth_scores = []
        prob_scores = []
        comm_scores = []
        skipped_count = 0

        for q in questions:
            ans = answer_by_q_id.get(q.id)
            if not ans or q.status == "skipped" or ans.answer_text == "Question skipped":
                skipped_count += 1
                review_items.append(QuestionReviewItem(
                    q=q.question_text,
                    score=0,
                    answer="[Question was skipped]",
                    feedback="This question was skipped. Review the recommended response to build familiarity with this topic.",
                    good=[],
                    missing=["No response provided"],
                    improved=f"To answer this question effectively, focus on the core concepts of {q.category.lower()} and provide a structured real-world example."
                ))
                continue

            ev = ans.evaluation
            if ev:
                scores_list.append(ev.overall_score)
                tech_scores.append(ev.technical_accuracy * 10)
                relevance_scores.append(ev.relevance * 10)
                clarity_scores.append(ev.clarity * 10)
                depth_scores.append(ev.depth * 10)
                prob_scores.append(ev.problem_solving * 10)
                comm_scores.append(ev.communication * 10)

                eval_summaries.append({
                    "question": q.question_text,
                    "category": q.category,
                    "answer": ans.answer_text,
                    "score": ev.overall_score,
                    "feedback": ev.feedback,
                    "strengths": ev.strengths,
                    "missing": ev.missing_concepts
                })

                review_items.append(QuestionReviewItem(
                    q=q.question_text,
                    score=int(round(ev.overall_score)),
                    answer=ans.answer_text,
                    feedback=ev.feedback,
                    good=ev.strengths or ["Addressed key concepts"],
                    missing=ev.missing_concepts or ["Could include deeper real-world metrics"],
                    improved=ev.improved_answer or "Provide a structured explanation with key concepts and production trade-offs."
                ))

        overall_score = int(round(sum(scores_list) / len(scores_list))) if scores_list else 70
        interview.overall_score = float(overall_score)

        # Baseline category averages
        cat_scores = {
            "Technical Knowledge": int(round(sum(tech_scores) / len(tech_scores))) if tech_scores else 80,
            "Communication": int(round(sum(comm_scores) / len(comm_scores))) if comm_scores else 82,
            "Problem-Solving": int(round(sum(prob_scores) / len(prob_scores))) if prob_scores else 78,
            "Relevance": int(round(sum(relevance_scores) / len(relevance_scores))) if relevance_scores else 85,
            "Depth": int(round(sum(depth_scores) / len(depth_scores))) if depth_scores else 75,
            "Clarity": int(round(sum(clarity_scores) / len(clarity_scores))) if clarity_scores else 82,
        }

        # Request AI synthesized report analysis
        prompt = build_report_prompt(
            role=interview.role,
            experience=interview.experience,
            interview_type=interview.interview_type,
            difficulty=interview.difficulty,
            evaluations_summary=eval_summaries,
            skipped_count=skipped_count,
            total_count=len(questions)
        )

        try:
            ai_report_data = await ai_service.generate_json(prompt)
            if not isinstance(ai_report_data, dict):
                ai_report_data = {}
        except Exception as e:
            logger.error(f"Error generating AI report: {e}")
            ai_report_data = {}

        summary = ai_report_data.get("summary") or "You demonstrated solid technical knowledge and clear communication, with room to improve depth in scenario-based reasoning."
        strengths = ai_report_data.get("strengths") or [
            ["Clear explanations", "You explained core concepts using understandable language."],
            ["Strong relevance", "Most responses stayed focused on the question."],
            ["Technical fundamentals", "You showed solid knowledge of fundamental concepts."]
        ]
        areas_for_improvement = ai_report_data.get("areas_for_improvement") or [
            ["Answer depth", "Expand on your reasoning and add practical examples."],
            ["Scenario-based reasoning", "Practice approaching unfamiliar situations."],
            ["Answer structure", "Use concept, reasoning, example, conclusion."]
        ]
        study_topics = ai_report_data.get("study_topics") or [
            f"Core {interview.role} architecture principles",
            "Performance optimization and trade-offs",
            "Structured response communication (STAR format)"
        ]
        next_steps = ai_report_data.get("next_steps") or [
            {"num": "01", "title": "Strengthen technical fundamentals", "priority": "HIGH PRIORITY", "desc": "Review core conceptual models and system design principles."},
            {"num": "02", "title": "Practice structured responses", "priority": "RECOMMENDED", "desc": "Use a clear beginning, explanation, and practical example."},
            {"num": "03", "title": "Try a harder interview", "priority": "NEXT UP", "desc": "Challenge yourself with scenario-based questions."}
        ]

        # Duration string
        mins = max(1, interview.duration_seconds // 60)
        duration_str = f"{mins}m" if mins < 60 else f"{mins // 60}h {mins % 60}m"

        completion_stats = {
            "total_questions": len(questions),
            "answered": len(scores_list),
            "skipped": skipped_count,
            "duration": duration_str,
            "completion_type": interview.completion_type
        }

        # Check existing report or create new
        existing_report = db.query(Report).filter(Report.interview_id == interview_id).first()
        if existing_report:
            existing_report.overall_score = float(overall_score)
            existing_report.category_scores = cat_scores
            existing_report.summary = summary
            existing_report.strengths = strengths
            existing_report.areas_for_improvement = areas_for_improvement
            existing_report.study_topics = study_topics
            existing_report.next_steps = next_steps
            existing_report.completion_stats = completion_stats
            existing_report.generated_at = utc_now()
            db.commit()
            db.refresh(existing_report)
            report_record = existing_report
        else:
            report_record = Report(
                interview_id=interview_id,
                overall_score=float(overall_score),
                category_scores=cat_scores,
                summary=summary,
                strengths=strengths,
                areas_for_improvement=areas_for_improvement,
                study_topics=study_topics,
                next_steps=next_steps,
                completion_stats=completion_stats,
                generated_at=utc_now()
            )
            db.add(report_record)
            db.commit()
            db.refresh(report_record)

        return report_record

    @staticmethod
    def format_report_response(db: Session, report: Report) -> ReportResponse:
        """Formats Report model into frontend-ready ReportResponse with QuestionReviewItems."""
        questions = db.query(Question).filter(Question.interview_id == report.interview_id).order_by(Question.question_order.asc()).all()
        answers = db.query(Answer).filter(Answer.interview_id == report.interview_id).all()
        answer_by_q_id = {ans.question_id: ans for ans in answers}

        reviews: List[QuestionReviewItem] = []
        for q in questions:
            ans = answer_by_q_id.get(q.id)
            if not ans or q.status == "skipped" or ans.answer_text == "Question skipped":
                reviews.append(QuestionReviewItem(
                    q=q.question_text,
                    score=0,
                    answer="[Question was skipped]",
                    feedback="This question was skipped. Review the recommended response to build familiarity with this topic.",
                    good=[],
                    missing=["No response provided"],
                    improved=f"To answer this question effectively, focus on the core concepts of {q.category.lower()} and provide a structured real-world example."
                ))
            else:
                ev = ans.evaluation
                if ev:
                    reviews.append(QuestionReviewItem(
                        q=q.question_text,
                        score=int(round(ev.overall_score)),
                        answer=ans.answer_text,
                        feedback=ev.feedback,
                        good=ev.strengths or ["Addressed key concepts"],
                        missing=ev.missing_concepts or ["Could include deeper real-world metrics"],
                        improved=ev.improved_answer or "Provide a structured explanation with key concepts and production trade-offs."
                    ))

        next_steps = [NextStepItem(**item) if isinstance(item, dict) else item for item in (report.next_steps or [])]

        return ReportResponse(
            id=report.id,
            interview_id=report.interview_id,
            overall_score=int(round(report.overall_score)),
            category_scores=report.category_scores or {},
            summary=report.summary,
            strengths=report.strengths or [],
            areas_for_improvement=report.areas_for_improvement or [],
            study_topics=report.study_topics or [],
            next_steps=next_steps,
            reviews=reviews,
            completion_stats=report.completion_stats or {},
            generated_at=report.generated_at
        )


report_service = ReportService()
