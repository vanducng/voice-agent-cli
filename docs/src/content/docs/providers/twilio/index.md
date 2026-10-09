---
title: Twilio
description: Numbers, Elastic SIP trunks, messages, recordings, and alerts
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
| `trunks` | List, get, and update routing settings |
| `trunks origination` | Add, update, or remove an origination URL |
| `trunks credentials` | List, associate, or remove a credential list |
| `trunks ip-access-control-lists` | List, associate, or remove an IP access control list |
| `calls` | List and get calls, and list call events |
| `messages` | List and get SMS messages |
| `messaging-services` | List and get messaging services |
| `recordings` | List and get recording metadata |
| `alerts` | List and get Monitor alerts |

Generated help is the flag reference:

```bash
vac twilio --help
vac twilio numbers --help
vac twilio trunks origination --help
vac twilio calls list --help
vac twilio messages list --help
vac twilio alerts list --help
```

Lists return `{ "items", "has_more", "pagination_key" }`. `--limit` is 1 to 1000. Pass `--pagination-key` from the previous page. `--fields` projects the documented fields and rejects unknown names.

Number fields: `sid`, `phone_number`, `friendly_name`, `trunk_sid`, `voice_url`, `voice_method`, `voice_application_sid`, `sms_url`, `status_callback`.

Trunk fields: `sid`, `domain_name`, `friendly_name`, `secure`, `transfer_mode`, `transfer_caller_id`, `recording`, `auth_type`, `disaster_recovery_url`, `disaster_recovery_method`, `cnam_lookup_enabled`, `symmetric_rtp_enabled`, `origination_urls`, `phone_numbers`. Each origination URL includes `sid`, `sip_url`, `enabled`, `priority`, `weight`, and `friendly_name`.

Call fields add `answered_by` and `queue_time`. Filters are `--from`, `--to`, `--status`, `--start-after`, and `--start-before`. Timestamps are UTC ISO-8601. `calls events` returns redacted `request` and `response` summaries for Programmable Voice. Twilio exposes that subresource about 15 minutes after the call ends. Elastic SIP trunk calls return `NOT_FOUND`.

Message fields are `sid`, `to`, `from`, `status`, `direction`, `error_code`, `error_message`, `messaging_service_sid`, `num_segments`, `date_sent`, and `date_created`. `body` is omitted unless `--include-body` is set. Messaging service get includes the sender-pool phone numbers.

Alert list omits `alert_text`. Alert get includes a redacted `alert_text` and `more_info`. Request variables and response bodies are never printed. Recording commands return metadata only and never a media URL. Credential list output is `sid` and `friendly_name` only.

## Writes

Writes attach or detach a number, change a trunk's routing settings, add, update, or remove an origination URL, and associate or remove an existing credential list or IP access control list. Each accepts `--dry-run`, which prints `before` and `after` and sends no mutation. A real write reads the resource again and returns `dry_run: false` with that read-back. If the read-back does not match, the command exits `RECONCILIATION_FAILED` and does not claim success.

```bash
vac twilio numbers update +15555550100 --trunk TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --dry-run
vac twilio numbers update PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --trunk none --dry-run
vac twilio trunks origination add TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  --sip-url sip:example.pstn.example.com --priority 10 --weight 10 --dry-run
vac twilio trunks origination update TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  OUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --enabled false --dry-run
vac twilio trunks origination remove TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  OUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --dry-run
vac twilio trunks update TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  --disaster-recovery-url none --recording-mode do-not-record --dry-run
vac twilio trunks credentials associate TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  --credential-list CLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --dry-run
vac twilio trunks ip-access-control-lists associate TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  --ip-access-control-list ALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --dry-run
```

`--trunk none` detaches the number. `--disaster-recovery-url none` clears that URL. `--priority` is an integer from 0 to 65535, lower first. `--weight` is an integer from 1 to 65535. `--enabled`, `--secure`, and `--cnam-lookup-enabled` take `true` or `false`. `--sip-url` must be a `sip:` URI. Recording changes use the trunk Recording resource. Credential and IP access control commands associate an existing SID. They do not create lists or return passwords.

The CLI does not send messages, place calls, buy or release numbers, create or delete trunks, rename a trunk domain, create SIP credentials, or download recording media.

A failed write caused by rate limit, server error, timeout, or connection loss is not retryable. Read the resource before trying the write again.
