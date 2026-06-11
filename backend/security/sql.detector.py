import re

SQLI_PATTERNS = [
    r"union\s+select",
    r"drop\s+table",
    r"or\s+1=1",
    r"information_schema"
]

def detect_sqli(data):
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, data, re.IGNORECASE):
            return True
    return False