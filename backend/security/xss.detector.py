import re

XSS_PATTERNS = [
    r"<script.*?>",
    r"javascript:",
    r"onerror=",
    r"alert\(",
]

def detect_xss(data):
    for pattern in XSS_PATTERNS:
        if re.search(pattern, data, re.IGNORECASE):
            return True
    return False