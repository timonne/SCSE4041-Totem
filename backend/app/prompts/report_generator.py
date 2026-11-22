from typing import List, Dict, Any


def build_report_prompt(
    role: str,
    experience: str,
    interview_type: str,
    difficulty: str,
    evaluations_summary: List[Dict[str, Any]],
    skipped_count: int,
    total_count: int
) -> str:
    return f"""You are the Lead Hiring Committee Chair and Principal Technical Assessor.
Generate a comprehensive, actionable candidate assessment report.

Session Context:
- Role: {role}
- Experience Level: {experience}
- Interview Type: {interview_type}
- Difficulty: {difficulty}
- Questions Completed/Evaluated: {len(evaluations_summary)} of {total_count}
- Questions Skipped: {skipped_count}

Evaluated Questions and Answers:
{evaluations_summary}

Report Requirements:
1. Synthesize an objective assessment of the candidate's actual performance.
2. Calculate scores for the 6 core categories (0-100 each):
   - Technical Knowledge
   - Communication
   - Problem-Solving
   - Relevance
   - Depth
   - Clarity
3. Identify exactly 3 real strengths ("What you did well") as [title, description] pairs.
4. Identify exactly 3 real areas for improvement ("Areas to focus on") as [title, description] pairs.
5. Provide specific technical topics to study derived from actual gaps observed.
6. Provide exactly 3 prioritized next steps (each with: num ("01","02","03"), title, priority ("HIGH PRIORITY", "RECOMMENDED", "NEXT UP"), and desc).

Return strictly JSON:
{{
  "overall_score": 84,
  "category_scores": {{
    "Technical Knowledge": 86,
    "Communication": 82,
    "Problem-Solving": 78,
    "Relevance": 91,
    "Depth": 74,
    "Clarity": 88
  }},
  "summary": "You demonstrated solid technical knowledge and clear communication, with room to improve depth in scenario-based reasoning.",
  "strengths": [
    ["Clear explanations", "You explained core concepts using understandable language."],
    ["Strong relevance", "Most responses stayed focused on the question."],
    ["Technical fundamentals", "You showed solid knowledge of fundamental concepts."]
  ],
  "areas_for_improvement": [
    ["Answer depth", "Expand on your reasoning and add practical examples."],
    ["Scenario-based reasoning", "Practice approaching unfamiliar situations."],
    ["Answer structure", "Use concept, reasoning, example, conclusion."]
  ],
  "study_topics": [
    "Operating system scheduling and context switching",
    "Database indexing and query execution plans",
    "STAR technique for conflict resolution stories"
  ],
  "next_steps": [
    {{
      "num": "01",
      "title": "Strengthen technical fundamentals",
      "priority": "HIGH PRIORITY",
      "desc": "Review operating systems, DBMS, and networking concepts."
    }},
    {{
      "num": "02",
      "title": "Practice structured responses",
      "priority": "RECOMMENDED",
      "desc": "Use a clear beginning, explanation, and practical example."
    }},
    {{
      "num": "03",
      "title": "Try a harder interview",
      "priority": "NEXT UP",
      "desc": "Challenge yourself with scenario-based questions."
    }}
  ]
}}
"""
