"""Versioned system prompts. Each module exposes a stable PROMPT constant."""

from . import classify_document, echo

__all__ = ["classify_document", "echo"]
