---
title: Output contract
description: JSON stdout and structured JSON errors for automation
---

Successful command data is JSON on stdout and can be piped to tools such as `jq`. Its schema is command-specific: direct resource reads preserve provider fields, while list, search, analysis, and version commands may normalize, project, or enrich the result. Command-owned success responses add `"ok": true`.

```bash
vac retell agents list --fields agent_id,agent_name | jq '.items'
```

Failures write one structured JSON object to stderr and set a nonzero exit status. `src/core/cli-response.ts` defines the outer shape and the Retell formatter maps provider failures into safe codes.

```json
{
  "ok": false,
  "error": {
    "code": "AUTH_ERROR",
    "message": "Retell authentication failed.",
    "retryable": false,
    "next_steps": [
      "Set RETELL_API_KEY for this process or run `vac retell login`.",
      "Run `vac retell agents list --limit 1` to verify authentication."
    ]
  }
}
```

Automation should branch on `error.code`, retry only when `retryable` is `true`, and follow `next_steps` in order. Error messages are redacted and truncated by `src/providers/retell/services/output-formatter.ts`.

`--help` and `--version` intentionally remain human-readable. Treat them as discovery output, not JSON command data.
