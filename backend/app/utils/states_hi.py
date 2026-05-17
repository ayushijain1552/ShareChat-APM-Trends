"""Indian states & UTs — Hindi names and detection in news text."""

from __future__ import annotations

import re

# ISO-like codes → (English names/aliases, Hindi)
STATE_REGISTRY: dict[str, tuple[str, ...]] = {
    "AN": ("andaman and nicobar", "andaman", "nicobar", "अंडमान"),
    "AP": ("andhra pradesh", "andhra"),
    "AR": ("arunachal pradesh", "arunachal"),
    "AS": ("assam",),
    "BR": ("bihar",),
    "CH": ("chandigarh",),
    "CG": ("chhattisgarh", "chattisgarh"),
    "DL": ("delhi", "new delhi"),
    "GA": ("goa",),
    "GJ": ("gujarat",),
    "HR": ("haryana",),
    "HP": ("himachal pradesh", "himachal"),
    "JH": ("jharkhand",),
    "JK": ("jammu and kashmir", "jammu", "kashmir"),
    "KA": ("karnataka", "bengaluru", "bangalore"),
    "KL": ("kerala", "kochi", "thiruvananthapuram"),
    "LA": ("ladakh",),
    "LD": ("lakshadweep",),
    "MP": ("madhya pradesh", "madhya"),
    "MH": ("maharashtra", "mumbai", "pune"),
    "MN": ("manipur",),
    "ML": ("meghalaya", "shillong"),
    "MZ": ("mizoram",),
    "NL": ("nagaland",),
    "OD": ("odisha", "orissa"),
    "PB": ("punjab", "amritsar"),
    "PY": ("puducherry", "pondicherry"),
    "RJ": ("rajasthan", "jaipur"),
    "SK": ("sikkim",),
    "TN": ("tamil nadu", "tamilnadu", "chennai"),
    "TS": ("telangana", "hyderabad"),
    "TR": ("tripura",),
    "UP": ("uttar pradesh", "uttar"),
    "UK": ("uttarakhand", "uttaranchal"),
    "WB": ("west bengal", "kolkata", "calcutta"),
}

STATE_HINDI: dict[str, str] = {
    "AN": "अंडमान और निकोबार",
    "AP": "आंध्र प्रदेश",
    "AR": "अरुणाचल प्रदेश",
    "AS": "असम",
    "BR": "बिहार",
    "CH": "चंडीगढ़",
    "CG": "छत्तीसगढ़",
    "DL": "दिल्ली",
    "GA": "गोआ",
    "GJ": "गुजरात",
    "HR": "हरियाणा",
    "HP": "हिमाचल प्रदेश",
    "JH": "झारखंड",
    "JK": "जम्मू और कश्मीर",
    "KA": "कर्नाटक",
    "KL": "केरल",
    "LD": "लक्षद्वीप",
    "LA": "लद्दाख",
    "MP": "मध्य प्रदेश",
    "MH": "महाराष्ट्र",
    "MN": "मणिपुर",
    "ML": "मेघालय",
    "MZ": "मिज़ोरम",
    "NL": "नागालैंड",
    "OD": "ओडिशा",
    "PB": "पंजाब",
    "PY": "पुडुचेरी",
    "RJ": "राजस्थान",
    "SK": "सिक्किम",
    "TN": "तमिल नाडु",
    "TS": "तेलंगाना",
    "TR": "त्रिपुरा",
    "UP": "उत्तर प्रदेश",
    "UK": "उत्तराखंड",
    "WB": "पश्चिम बंगाल",
}

# Longest English aliases first for substring replacement in copy
_ALIAS_TO_CODE: list[tuple[str, str]] = []
for code, aliases in STATE_REGISTRY.items():
    for alias in aliases:
        if re.search(r"[\u0900-\u097F]", alias):
            continue
        _ALIAS_TO_CODE.append((alias.lower(), code))
_ALIAS_TO_CODE.sort(key=lambda x: len(x[0]), reverse=True)

# Flat map for transliteration tokens (lowercase English → Hindi)
_EN_TO_HI: dict[str, str] = {}
for code, aliases in STATE_REGISTRY.items():
    hi = STATE_HINDI[code]
    for alias in aliases:
        if not re.search(r"[\u0900-\u097F]", alias):
            _EN_TO_HI[alias.lower()] = hi
for code, hi in STATE_HINDI.items():
    for alias in STATE_REGISTRY.get(code, ()):
        if not re.search(r"[\u0900-\u097F]", alias):
            _EN_TO_HI[alias.lower()] = hi


def hindi_state_name(code: str) -> str:
    return STATE_HINDI.get(code.upper(), code)


def state_hi_for_token(token: str) -> str | None:
    return _EN_TO_HI.get(token.lower().strip())


def detect_state_codes(text: str) -> set[str]:
    if not text:
        return set()
    lower = text.lower()
    found: set[str] = set()
    for alias, code in _ALIAS_TO_CODE:
        if alias in lower:
            found.add(code)
    return found


def translate_states_in_text(text: str) -> str:
    """Replace English state/ city aliases with Hindi names in prose."""
    if not text or not text.strip():
        return text
    result = text
    for alias, code in _ALIAS_TO_CODE:
        hi = STATE_HINDI[code]
        pattern = re.compile(re.escape(alias), re.IGNORECASE)
        result = pattern.sub(hi, result)
    return result
