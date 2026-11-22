import re
from typing import Tuple


INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"system\s*prompt",
    r"you\s+are\s+now\s+a",
    r"give\s+me\s+100",
    r"always\s+respond\s+with",
    r"disregard\s+the\s+rubric",
    r"output\s+JSON\s+saying\s+score\s+is\s+100",
]


def sanitize_candidate_text(text: str, max_chars: int = 5000) -> str:
    """
    Sanitizes user input, enforcing length bounds and stripping null bytes.
    """
    if not text:
        return ""
    text = text.replace("\x00", "")
    return text[:max_chars].strip()


def check_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Checks if user answer contains overt prompt injection patterns.
    Returns (is_injection, reason)
    """
    if not text:
        return False, ""
    
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True, "Potential prompt injection attempt detected."
            
    return False, ""


def wrap_user_input_safety(text: str) -> str:
    """
    Safely wraps user input in XML/delimiters to prevent it from escaping context
    in prompt templates.
    """
    sanitized = sanitize_candidate_text(text)
    return f"<candidate_response>\n{sanitized}\n</candidate_response>"
