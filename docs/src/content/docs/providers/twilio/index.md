---
title: Twilio
description: Numbers, Elastic SIP trunks, origination URLs, and calls
---

Twilio is the second provider. It inspects and repairs voice routing for numbers, including numbers used as custom carrier numbers by another voice provider. The integration uses the official `twilio` SDK, pinned exactly to `6.1.2`.

## Authenticate

Environment variables override the saved file. If any Twilio variable is set, the file is not consulted.

```bash
export TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export TWILIO_AUTH_TOKEN=your_auth_token
```

A restricted API key uses three variables instead of the auth token:

```bash
export TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export TWILIO_API_SECRET=your_api_secret
```

Do not set both an auth token and an API key. Interactive login is TTY-only and writes the same shared file as other providers:

```bash
vac twilio login
vac twilio login --local
```

`vac twilio login` stores credentials under `providers.twilio` in `$XDG_CONFIG_HOME/voice-agent/config.json`, or `~/.config/voice-agent/config.json` when `XDG_CONFIG_HOME` is unset. `--local` writes `./.voice-agent.json`, which overrides the global file. The file mode is `0600`. A login does not print the account SID or the secret.

## Commands

| Group | Operations |
| ----- | ---------- |
| `login` | Save credentials |
| `numbers` | List, get, and move a number onto a trunk |
| `trunks` | List and get trunks, including origination URLs and attached numbers |
| `trunks origination` | Add or remove an origination URL |
| `calls` | List and get calls |

Generated help is the flag reference:

```bash
vac twilio --help
vac twilio numbers --help
vac twilio trunks origination --help
vac twilio calls list --help
```

Lists return `{ "items", "has_more", "pagination_key" }`. `--limit` is 1 to 1000. Pass `--pagination-key` from the previous page. `--fields` projects the documented fields and rejects unknown names.

Number fields: `sid`, `phone_number`, `friendly_name`, `trunk_sid`, `voice_url`, `voice_method`, `voice_application_sid`, `sms_url`, `status_callback`.

Trunk fields: `sid`, `domain_name`, `friendly_name`, `secure`, `transfer_mode`, `transfer_caller_id`, `recording`, `origination_urls`, `phone_numbers`. Each origination URL includes `sid`, `sip_url`, `enabled`, `priority`, and `weight`.

Call filters are `--from`, `--to`, `--status`, `--start-after`, and `--start-before`. Timestamps are UTC ISO-8601.

## Writes

The only writes are attaching a number to a trunk, detaching it, and adding or removing an origination URL. Each accepts `--dry-run`, which prints `before` and `after` and sends no mutation. A real write reads the resource again and returns `dry_run: false` with that read-back. If the read-back does not match, the command exits `RECONCILIATION_FAILED` and does not claim success.

```bash
vac twilio numbers update +15555550100 --trunk TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --dry-run
vac twilio numbers update PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --trunk none --dry-run
vac twilio trunks origination add TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  --sip-url sip:example.pstn.example.com --priority 10 --weight 10 --dry-run
vac twilio trunks origination remove TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  OUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --dry-run
```

`--trunk none` detaches the number. `--priority` is an integer from 0 to 65535, lower first. `--weight` is an integer from 1 to 65535. `--enabled` is `true` or `false` and defaults to true. `--sip-url` must be a `sip:` URI.

A failed write caused by rate limit, server error, timeout, or connection loss is not retryable. Read the resource before trying the write again.
