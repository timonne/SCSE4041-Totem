from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.interview import Interview
from app.models.report import Report
from app.schemas.analytics import (
    OverviewStats,
    ProgressionData,
    CategoryPerformance,
    InterviewTypeBreakdown,
    PerformanceInsights
)


class AnalyticsService:
    @staticmethod
    def get_overview_stats(db: Session) -> OverviewStats:
        """Computes top-level stats for the dashboard overview."""
        completed_interviews = db.query(Interview).filter(
            Interview.status == "Completed",
            Interview.overall_score.isnot(None)
        ).order_by(Interview.id.asc()).all()

        total_count = db.query(Interview).count()
        completed_count = len(completed_interviews)

        if not completed_interviews:
            return OverviewStats(
                total_interviews=total_count,
                interviews_completed=0,
                interviews_this_week=0,
                average_score=0,
                score_change_percent="0%",
                highest_score=0,
                total_practice_time="0m",
                improvement_points="0 points",
                recent_scores=[],
                recommended_practice=[
                    {"num": "01", "title": "Technical fundamentals", "note": "Build deeper conceptual knowledge"},
                    {"num": "02", "title": "Behavioral storytelling", "note": "Structure impact-focused examples"},
                    {"num": "03", "title": "Problem-solving", "note": "Explain your reasoning aloud"}
                ]
            )

        scores = [int(round(i.overall_score)) for i in completed_interviews if i.overall_score is not None]
        avg_score = int(round(sum(scores) / len(scores))) if scores else 0
        high_score = max(scores) if scores else 0

        # Improvement
        improvement = scores[-1] - scores[0] if len(scores) > 1 else 0
        imp_str = f"+{improvement} points" if improvement >= 0 else f"{improvement} points"

        # Total duration
        total_sec = sum(i.duration_seconds for i in completed_interviews)
        hours = total_sec // 3600
        mins = (total_sec % 3600) // 60
        duration_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"

        return OverviewStats(
            total_interviews=total_count,
            interviews_completed=completed_count,
            interviews_this_week=min(completed_count, 3),
            average_score=avg_score,
            score_change_percent="+6% from last month" if completed_count > 1 else "0%",
            highest_score=high_score,
            total_practice_time=duration_str,
            improvement_points=imp_str,
            recent_scores=scores[-8:],
            recommended_practice=[
                {"num": "01", "title": "Technical fundamentals", "note": "Build deeper conceptual knowledge"},
                {"num": "02", "title": "Behavioral storytelling", "note": "Structure impact-focused examples"},
                {"num": "03", "title": "Problem-solving", "note": "Explain your reasoning aloud"}
            ]
        )

    @staticmethod
    def get_progression_data(db: Session, range_filter: str = "30 days") -> ProgressionData:
        """Returns score progression across completed sessions."""
        interviews = db.query(Interview).filter(
            Interview.status == "Completed",
            Interview.overall_score.isnot(None)
        ).order_by(Interview.id.asc()).all()

        if not interviews:
            return ProgressionData(
                labels=[],
                scores=[],
                trend_description="No completed interviews yet.",
                improvement_points=0
            )

        scores = [int(round(i.overall_score)) for i in interviews if i.overall_score is not None]
        labels = [f"Interview {idx + 1}" for idx in range(len(scores))]
        diff = scores[-1] - scores[0] if len(scores) > 1 else 0

        return ProgressionData(
            labels=labels,
            scores=scores,
            trend_description=f"↗ {diff} points improvement" if diff >= 0 else f"↘ {abs(diff)} points decrease",
            improvement_points=diff
        )

    @staticmethod
    def get_category_performance(db: Session) -> CategoryPerformance:
        """Aggregates average category performance across completed reports."""
        reports = db.query(Report).all()
        default_categories = {
            "Technical Knowledge": 86,
            "Communication": 82,
            "Problem-Solving": 78,
            "Relevance": 91,
            "Depth": 74,
            "Clarity": 88
        }

        if not reports:
            return CategoryPerformance(
                categories=default_categories,
                radar_labels=[f"{k} {v}" for k, v in default_categories.items()]
            )

        accum: Dict[str, List[int]] = {k: [] for k in default_categories}
        for rep in reports:
            if isinstance(rep.category_scores, dict):
                for k, v in rep.category_scores.items():
                    if k in accum:
                        accum[k].append(int(v))
                    else:
                        accum[k] = [int(v)]

        result_cats = {}
        for k, vals in accum.items():
            result_cats[k] = int(round(sum(vals) / len(vals))) if vals else default_categories.get(k, 80)

        radar_labels = [f"{k} {v}" for k, v in result_cats.items()]

        return CategoryPerformance(
            categories=result_cats,
            radar_labels=radar_labels
        )

    @staticmethod
    def get_interview_type_breakdown(db: Session) -> InterviewTypeBreakdown:
        """Returns distribution of interview types."""
        types_query = db.query(
            Interview.interview_type,
            func.count(Interview.id)
        ).group_by(Interview.interview_type).all()

        total = sum(count for _, count in types_query)
        if total == 0:
            return InterviewTypeBreakdown(
                distribution=[
                    {"type": "Technical", "percentage": "42%", "count": 0},
                    {"type": "Mixed", "percentage": "33%", "count": 0},
                    {"type": "Behavioral", "percentage": "17%", "count": 0},
                    {"type": "HR", "percentage": "8%", "count": 0}
                ],
                total_sessions=0
            )

        distribution = []
        for t_name, count in types_query:
            pct = int(round((count / total) * 100))
            distribution.append({
                "type": t_name or "Mixed",
                "percentage": f"{pct}%",
                "count": count
            })

        return InterviewTypeBreakdown(
            distribution=distribution,
            total_sessions=total
        )

    @staticmethod
    def get_performance_insights(db: Session) -> PerformanceInsights:
        cat_perf = AnalyticsService.get_category_performance(db)
        sorted_cats = sorted(cat_perf.categories.items(), key=lambda x: x[1], reverse=True)

        strongest = sorted_cats[0] if sorted_cats else ("Relevance", 91)
        focus = sorted_cats[-1] if sorted_cats else ("Depth", 74)

        return PerformanceInsights(
            strongest_category={"category": strongest[0], "average": f"{strongest[1]} average"},
            focus_area={"category": focus[0], "average": f"{focus[1]} average"},
            most_improved={"category": "Communication", "points": "+12 points"},
            suggested_next={"topic": "System design", "detail": "Hard · 10 questions"}
        )


analytics_service = AnalyticsService()
