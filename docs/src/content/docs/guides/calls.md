---
title: Update calls
description: Choose persisted updates or ongoing live-call overrides
---

The CLI has two call update contracts.

## Persisted call data

`calls update` uses the Retell SDK update operation for metadata, custom attributes, and data-storage settings on an ended call:

```bash
vac retell calls update call_123 \
  --metadata '{"case_id":"case_456"}'
```

JSON flags accept inline JSON or `@path/to/file.json`. Run `vac retell calls update --help` for the current mutation flags.

## Ongoing call state

`calls update-live` targets an ongoing call. It accepts any combination of dynamic-variable overrides, metadata, data-storage settings, additional context, and an immediate response trigger:

```bash
vac retell calls update-live call_123 \
  --dynamic-variables '{"customer_name":"Avery"}' \
  --metadata '{"case_id":"case_456"}' \
  --data-storage-setting everything_except_pii \
  --additional-context "The customer has verified their identity." \
  --trigger-response
```

Dynamic-variable values must be strings. Pass `--dynamic-variables null` to clear the override. The CLI sends override fields under `fields_to_override` and control fields under `call_control` to `PATCH /v2/update-live-call/{call_id}`. At least one mutation flag is required.

## Rerun completed analysis

Rerunning analysis is a mutation and can replace analysis results. Retrieve the call first, get explicit authorization, then run:

```bash
vac retell calls rerun-analysis call_123
```

For a completed chat, use `vac retell chats rerun-analysis chat_123`. These commands disable automatic SDK retries to avoid replaying the mutation.

See [Retell API compatibility](../../providers/retell/compatibility/) for the current endpoint and payload coverage.
