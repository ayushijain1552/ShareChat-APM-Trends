"""Spell Latin acronyms letter-by-letter in Devanagari (IPL → आईपीएल)."""

from __future__ import annotations

import re

# Common Indian news acronyms (canonical Devanagari spellings)
_KNOWN: dict[str, str] = {
    "IPL": "आईपीएल",
    "NEET": "एनईईटी",
    "JEE": "जेईई",
    "JIPMAT": "जेआईपीएमएटी",
    "CBSE": "सीबीएसई",
    "UPSC": "यूपीएससी",
    "RBI": "आरबीआई",
    "GDP": "जीडीपी",
    "ODI": "ओडीआई",
    "T20": "टी20",
    "BJP": "बीजेपी",
    "RSS": "आरएसएस",
    "NDTV": "एनडीटीवी",
    "IMD": "आईएमडी",
    "X": "एक्स",
    "AI": "एआई",
    "IT": "आईटी",
    "UK": "यूके",
    "US": "यूएस",
    "UN": "यूएन",
    "EU": "ईयू",
}

# All-caps headline words that are not acronyms (use phonetic / _TRANSLIT instead)
_NOT_ACRONYMS: frozenset[str] = frozenset(
    {
        "THE", "AND", "FOR", "WITH", "FROM", "THIS", "THAT", "NEWS", "LIVE",
        "BREAKING", "UPDATE", "INDIA", "WORLD", "TEAM", "MATCH", "FINAL",
        "SHARE", "CHAT", "VIDEO", "PHOTO", "TODAY", "YEAR", "WEEK", "GAME",
        "PLAY", "WINS", "LOST", "DRAW", "COACH", "LEAGUE", "CUP", "SERIES",
        "CRICKET", "ELECTION", "MODI", "RAHUL", "DELHI", "MUMBAI", "STATE",
        "COURT", "POLICE", "DEATH", "KILLED", "INDIAN", "GLOBAL", "LOCAL",
        "STOCK", "MARKET", "PRICE", "RUPEE", "BANK", "FILM", "SONG", "STAR",
        "ACTOR", "ACTRESS", "PARTY", "VOTE", "POLL", "RAIN", "FOOD", "HEALTH",
        "SCHOOL", "CLASS", "PAPER", "EXAM", "BOARD", "RESULT", "SCORE", "HIGH",
        "LOW", "NEW", "OLD", "BIG", "TOP", "BEST", "FULL", "FREE", "OPEN",
        "CLOSE", "CHIEF", "MINISTER", "PRIME", "SUPREME", "HIGH", "LOW",
    }
)

_LETTER_HI: dict[str, str] = {
    "a": "ए",
    "b": "बी",
    "c": "सी",
    "d": "डी",
    "e": "ई",
    "f": "एफ",
    "g": "जी",
    "h": "एच",
    "i": "आई",
    "j": "जे",
    "k": "के",
    "l": "एल",
    "m": "एम",
    "n": "एन",
    "o": "ओ",
    "p": "पी",
    "q": "क्यू",
    "r": "आर",
    "s": "एस",
    "t": "टी",
    "u": "यू",
    "v": "वी",
    "w": "डब्ल्यू",
    "x": "एक्स",
    "y": "वाई",
    "z": "ज़ेड",
}

_ALNUM_ACRONYM_RE = re.compile(r"^[A-Z]{1,6}\d{1,2}$")


def is_acronym_token(token: str) -> bool:
    """
    True only for real acronyms (IPL, NEET), not English words in caps (CRICKET).
    Title-case words (Cricket) are never acronyms.
    """
    if not token or not token.isascii():
        return False

    stripped = token.strip()
    if not stripped:
        return False

    upper = stripped.upper()

    if upper in _KNOWN:
        return True

    # Title case or mixed case → regular word (Cricket, Neet as proper noun in prose)
    if stripped != upper and not _ALNUM_ACRONYM_RE.match(stripped):
        return False

    if upper in _NOT_ACRONYMS:
        return False

    # T20, T20I style
    if _ALNUM_ACRONYM_RE.match(stripped):
        return True

    # Unknown acronym: short all-caps only (2–6 letters), not a dictionary word length
    if (
        stripped.isupper()
        and 2 <= len(upper) <= 6
        and re.fullmatch(r"[A-Z]+", upper)
    ):
        return True

    return False


def transliterate_acronym(token: str) -> str:
    key = token.upper().strip()
    if key in _KNOWN:
        return _KNOWN[key]
    parts: list[str] = []
    for ch in key:
        if ch.isalpha():
            parts.append(_LETTER_HI.get(ch.lower(), ch))
        else:
            parts.append(ch)
    return "".join(parts)
