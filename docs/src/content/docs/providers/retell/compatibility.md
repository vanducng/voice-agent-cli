---
title: Retell API compatibility
description: Current Retell SDK, endpoint, and payload compatibility
---

This page records the verified Retell contract as of 2026-07-27. The package pins `retell-sdk` to exactly `5.48.0`, the latest npm release on that date.

The CLI calls only current endpoints. It requires the current paginated response envelope with `items` and preserves optional `pagination_key` and `has_more` metadata. Legacy arrays and wrapper objects are rejected with an explicit contract error.

## Current endpoint coverage

| CLI operation | Current Retell contract | Implementation |
| --- | --- | --- |
| Voice agents list | `POST /v2/list-agents` with `channel: "voice"` | `client.agent.list()` |
| Chat agents list | `POST /v2/list-agents` with `channel: "chat"` | `client.chatAgent.list()` |
| Calls list and search | `POST /v3/list-calls` | `client.call.list()` |
| Chats list | `POST /v3/list-chats` | `client.chat.list()` |
| Batch tests list | `GET /v2/list-batch-tests` | `client.tests.listBatchTests()` |
| Conversation flow components list | `GET /v2/list-conversation-flow-components` | `client.conversationFlowComponent.list()` |
| Conversation flows list | `GET /v2/list-conversation-flows` | `client.conversationFlow.list()` |
| Phone numbers list | `GET /v2/list-phone-numbers` | `client.phoneNumber.list()` |
| Retell LLMs list | `GET /v2/list-retell-llms` | `client.llm.list()` |
| Test case definitions list | `GET /v2/list-test-case-definitions` | `client.tests.listTestCaseDefinitions()` |
| Test runs list | `GET /v2/list-test-runs/{test_case_batch_job_id}` | `client.tests.listTestRuns()` |
| Agent publish | `POST /publish-agent-version/{agent_id}` with an explicit version | `client.agent.publish()` or `client.chatAgent.publish()` |
| Live call override | `PATCH /v2/update-live-call/{call_id}` | Generic SDK `patch()` with the current path |

`retell-sdk` 5.48.0 does not expose a generated Update Live Call helper, so `calls update-live` uses the SDK's generic request client. The command currently supports `override_dynamic_variables` and returns the API's `{ "success": true }` response.

## Removed legacy contracts

| Removed contract | Current contract | CLI state |
| --- | --- | --- |
| `GET /list-agents` | `POST /v2/list-agents` | Not called; legacy response fallback removed |
| `GET /list-chat-agents` | `POST /v2/list-agents` with `channel: "chat"` | Not called; legacy response fallback removed |
| `POST /v2/list-calls` | `POST /v3/list-calls` | Not called; only the current paginated response is accepted |
| `GET /list-chat` | `POST /v3/list-chats` | Not called; only the current paginated response is accepted |
| Legacy unversioned resource list endpoints | The versioned SDK list endpoints above | Not called; shared pagination requires `items` |
| Legacy voice and chat publish endpoints | `POST /publish-agent-version/{agent_id}` | Not called |
| `Update Call` for ongoing calls | `PATCH /v2/update-live-call/{call_id}` | Live overrides use the current endpoint; persisted ended-call updates remain separate |

The old endpoint names above are migration history only. They are not present in executable CLI code.

## Current payload behavior

- Phone number assignments use weighted `inbound_agents` and `outbound_agents` arrays. A single agent becomes a one-entry array with weight `1`.
- Multilingual agents use explicit locale arrays such as `["en-US", "es-ES"]`. The removed scalar `"multi"` value is not supported.
- Voice and chat analysis use `post_call_analysis_data` and `post_chat_analysis_data`; removed top-level analysis prompt fields are not supported.
- Test case definitions use the SDK fields `name`, `user_prompt`, `metrics`, `response_engine`, `dynamic_variables`, `tool_mocks`, and `llm_model`.
- Test run results identify jobs with `test_case_job_id` and expose `result_explanation`; removed local `test_run_id` and `metric_results` shapes are not supported.
- Model and resource types come from the pinned SDK instead of local legacy unions.

## Official migration references

- [Agent list endpoint migration](https://docs.retellai.com/deprecation-notice/2026/07-31_agent_list_endpoints)
- [Versioned list endpoint migration](https://docs.retellai.com/deprecation-notice/2026/06-15_legacy_list_endpoints)
- [Unified publish endpoint migration](https://docs.retellai.com/deprecation-notice/2026/07-20_agent_version_endpoints)
- [Update Call restriction and Update Live Call migration](https://docs.retellai.com/deprecation-notice/2026/08-31_update_call_ended_calls_only)
- [Weighted phone number agent fields](https://docs.retellai.com/deprecation-notice/2026/03-31_phone_number_agent_fields)
- [Multilingual locale arrays](https://docs.retellai.com/deprecation-notice/2026/07-31_legacy_multilingual_setting)
- [Current Update Live Call API](https://docs.retellai.com/api-references/update-live-call)

## Verification

```bash
npm view retell-sdk version
npm ls retell-sdk --depth=0
npm run typecheck
npm test
npm run test:live:retell
```

The live smoke test reads Retell configuration from `.env`, calls the current voice-agent list contract, and never prints sensitive values.
