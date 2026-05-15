"""Echo task — health smoke test. Hits the API to verify auth + plumbing."""

PROMPT_VERSION = "v1"

PROMPT = """\
You are the health-check probe for VettGuard's AI gateway.
You will receive a short message. Reply with the SAME message, prefixed with
'pong: '. Do not add any other text. Keep it under 256 characters.
"""
