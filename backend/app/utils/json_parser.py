import json
import re
from typing import Any, Dict, Optional


def extract_and_parse_json(text: str) -> Optional[Dict[str, Any]]:
    """
    Robustly extract and parse JSON from LLM output.
    Handles markdown code blocks, partial text, trailing commas, etc.
    """
    if not text:
        return None
    
    text = text.strip()
    
    # Check for markdown code fences
    json_block = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if json_block:
        candidate = json_block.group(1).strip()
    else:
        # Check if there is an outer { ... } or [ ... ]
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        first_bracket = text.find("[")
        last_bracket = text.rfind("]")
        
        if first_brace != -1 and last_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
            candidate = text[first_brace:last_brace + 1]
        elif first_bracket != -1 and last_bracket != -1:
            candidate = text[first_bracket:last_bracket + 1]
        else:
            candidate = text

    # Try direct parse
    try:
        return json.loads(candidate)
    except Exception:
        pass

    # Clean up common LLM JSON syntax issues (e.g. trailing commas before } or ])
    cleaned = re.sub(r",\s*([\}\]])", r"\1", candidate)
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    return None
