---
title: Update calls
description: Choose persisted updates or ongoing live-call overrides
---

The CLI has two call update contracts.

## Persisted call data

`calls update` uses the Retell SDK update operation for metadata, custom attributes, and data-storage settings:

```bash
vac retell calls update call_123 \
  --metadata '{"case_id":"case_456"}'
```

JSON flags accept inline JSON or `@path/to/file.json`. Run `vac retell calls update --help` for the current mutation flags.

## Ongoing call state

`calls update-live` targets an ongoing call and currently exposes string dynamic-variable overrides:

```bash
vac retell calls update-live call_123 \
  --dynamic-variables '{"customer_name":"Avery"}'
```

Values must be strings. The implementation sends them under `fields_to_override.override_dynamic_variables` to `PATCH /v2/update-live-call/{call_id}`.

Retell is moving persisted Update Call behavior to ended calls only. See [Retell API compatibility](../../providers/retell/compatibility/) for the official migration and the CLI's current limit.
