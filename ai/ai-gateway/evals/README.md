# ai-gateway evals

Golden-case suite. Runs on every deploy; failures gate the rollout.

## Run locally

```bash
# 1. Start the ai-gateway in a separate shell.
ANTHROPIC_API_KEY=sk-ant-... uvicorn ai_gateway.main:app --port 8090

# 2. Run promptfoo against it.
ANTHROPIC_API_KEY=sk-ant-... \
AI_GATEWAY_URL=http://localhost:8090 \
pnpm dlx promptfoo@latest eval -c evals/promptfoo.yaml
```

The LLM-rubric assertion uses `openai:gpt-4o-mini` as judge for the refusal
case (cheap, independent of Claude). Set `OPENAI_API_KEY` to enable it; the
test is skipped without a key.

## Adding cases

Keep `tests:` small (≤10). These hit the real Anthropic API on each run —
every PR pays for them. Prefer one canonical example per failure mode over
many near-duplicates.

## CI

The promptfoo step is wired into `.github/workflows/ai-eval.yml` (TODO —
to be added when staging gets a stable URL). Until then, the suite is a
pre-deploy manual gate run by the founder.
