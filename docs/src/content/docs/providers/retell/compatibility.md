---
title: Retell API compatibility
description: Official Retell endpoint migrations and the CLI behavior that covers them
---

This page records current compatibility as of 2026-07-27. The root package pins `retell-sdk` to exactly `5.48.0`. Check both the official migration notice and the named local implementation before changing these contracts.

| Official migration                                                                    | Current CLI behavior                                                                                                                                 | Local evidence                                                                                           |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET /list-agents` and `GET /list-chat-agents` move to unified `POST /v2/list-agents` | `agents list` sends a `voice` channel filter; `chat-agents list` sends a `chat` channel filter. Both normalize paginated results.                    | `src/providers/retell/commands/agents/list.ts`, `src/providers/retell/commands/chat-agents/list.ts`      |
| `POST /v2/list-calls` moves to `POST /v3/list-calls`                                  | `transcripts list` uses `client.call.list()` and reads the unified paginated items.                                                                  | `src/providers/retell/commands/transcripts/list.ts`                                                      |
| `GET /list-chat` moves to `POST /v3/list-chats`                                       | `chats list` uses `client.chat.list()` and reads the unified paginated items.                                                                        | `src/providers/retell/commands/chats/list.ts`                                                            |
| Legacy voice/chat publish endpoints move to `POST /publish-agent-version/{agent_id}`  | Voice and chat publish commands use the pinned SDK publish methods and select an explicit draft version.                                             | `src/providers/retell/commands/agent/publish.ts`, `src/providers/retell/commands/chat-agents/publish.ts` |
| Single phone-agent fields move to weighted arrays                                     | Single-agent flags become one-entry arrays with weight `1`; plural flags parse `id:weight` entries whose weights must sum to `1`.                    | `src/providers/retell/services/weighted-agents.ts`                                                       |
| Ongoing updates move to Update Live Call                                              | `calls update-live` sends string dynamic variables under `fields_to_override.override_dynamic_variables`. Persisted `calls update` remains separate. | `src/providers/retell/commands/calls/update-live.ts`, `src/providers/retell/commands/calls/update.ts`    |
| Scalar `language: "multi"` moves to explicit locale arrays                            | Full agent JSON is passed through the SDK. Use a concrete array such as `["en-US", "es-ES"]`; do not send `"multi"`.                                 | `src/providers/retell/commands/agent/update.ts`, `src/providers/retell/commands/chat-agents/update.ts`   |

## Official notices

- [Legacy agent list endpoints removed](https://docs.retellai.com/deprecation-notice/2026/07-31_agent_list_endpoints) defines the unified endpoint, channel filters, `items`, `pagination_key`, and `has_more`.
- [Legacy list endpoints removed for v2/v3](https://docs.retellai.com/deprecation-notice/2026/06-15_legacy_list_endpoints) defines the call and chat list migrations.
- [Unified publish-agent-version endpoint](https://docs.retellai.com/deprecation-notice/2026/07-20_agent_version_endpoints) replaces both legacy publish endpoints.
- [Phone number single-agent fields removed](https://docs.retellai.com/deprecation-notice/2026/03-31_phone_number_agent_fields) defines the weighted agent arrays.
- [Update Call restricted to ended calls](https://docs.retellai.com/deprecation-notice/2026/08-31_update_call_ended_calls_only) moves live overrides under `fields_to_override`.
- [Multilingual agent locale array required](https://docs.retellai.com/deprecation-notice/2026/07-31_legacy_multilingual_setting) replaces scalar `"multi"` with explicit locale arrays.

## Local limits

The official Update Live Call API supports more fields than this CLI currently exposes. `vac retell calls update-live` exposes only `--dynamic-variables` and optional output field filtering. Use `vac retell calls update` only for its documented persisted metadata, custom attributes, and storage settings.

The CLI intentionally keeps separate `agents list` and `chat-agents list` commands even though Retell now uses one endpoint. The separate commands preserve a clear resource-specific user interface while applying the required channel filters internally.
