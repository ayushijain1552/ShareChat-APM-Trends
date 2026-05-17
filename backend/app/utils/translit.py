"""Approximate Roman → Devanagari for hashtags and display (rule-based, no ML)."""

from __future__ import annotations

import re

# Multi-char clusters first (greedy left-to-right walk)
_CLUSTERS: tuple[tuple[str, str], ...] = (
    ("chh", "छ"),
    ("ch", "च"),
    ("kh", "ख"),
    ("gh", "घ"),
    ("th", "थ"),
    ("dh", "ध"),
    ("ph", "फ"),
    ("bh", "भ"),
    ("sh", "श"),
    ("ee", "ी"),
    ("oo", "ू"),
    ("aa", "ा"),
    ("ai", "ै"),
    ("au", "ौ"),
    ("ei", "ै"),
    ("ou", "ौ"),
)

_VOWELS: dict[str, str] = {
    "a": "अ",
    "e": "े",
    "i": "ि",
    "o": "ो",
    "u": "ु",
}

_CONSONANTS: dict[str, str] = {
    "b": "ब",
    "c": "क",
    "d": "द",
    "f": "फ",
    "g": "ग",
    "h": "ह",
    "j": "ज",
    "k": "क",
    "l": "ल",
    "m": "म",
    "n": "न",
    "p": "प",
    "q": "क",
    "r": "र",
    "s": "स",
    "t": "त",
    "v": "व",
    "w": "व",
    "x": "क्स",
    "y": "य",
    "z": "ज",
}


def roman_to_devanagari(text: str) -> str:
    """
    Phonetic fallback when a token is not in the curated Hindi map.
    Tradeoff: imperfect for English headlines but yields readable Devanagari tags.
    """
    if not text or re.search(r"[\u0900-\u097F]", text):
        return text

    lower = re.sub(r"[^a-z]", "", text.lower())
    if not lower:
        return text

    out: list[str] = []
    i = 0
    while i < len(lower):
        if i == 0 and lower[i] in _VOWELS and lower[i] == "a":
            out.append("अ")
            i += 1
            continue

        matched = False
        for cluster, deva in _CLUSTERS:
            if lower.startswith(cluster, i):
                out.append(deva)
                i += len(cluster)
                matched = True
                break
        if matched:
            continue

        ch = lower[i]
        if ch in _CONSONANTS:
            out.append(_CONSONANTS[ch])
            i += 1
            continue

        if ch in _VOWELS:
            if ch == "a" and out:
                out.append("ा")
            else:
                out.append(_VOWELS.get(ch, ch))
            i += 1
            continue

        i += 1

    result = "".join(out)
    return result if re.search(r"[\u0900-\u097F]", result) else text
