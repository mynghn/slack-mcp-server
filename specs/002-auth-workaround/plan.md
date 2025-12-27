# Implementation Plan: Authentication Workaround with User Token

**Branch**: `002-auth-workaround` | **Date**: 2025-12-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-auth-workaround/spec.md`

## Summary

Add user token authentication as an alternative to bot token authentication for the Slack MCP server. This enables access to user-token-only APIs (particularly search functionality) by supporting `xoxc-*` tokens with the required `d` cookie for session authentication.

## Technical Context

**Language/Version**: TypeScript 5.9+ with Node.js 20+
**Primary Dependencies**: @modelcontextprotocol/sdk ^1.25.1, @slack/web-api ^7.13.0, zod ^4.2.1
**Storage**: N/A (stateless - credentials via environment variables)
**Testing**: vitest ^3.2.4
**Target Platform**: Node.js server (stdio transport for MCP)
**Project Type**: single (src/ directory structure)
**Performance Goals**: N/A (MCP tool latency dominated by Slack API)
**Constraints**: Must maintain backward compatibility with existing SLACK_BOT_TOKEN usage
**Scale/Scope**: Single user per server instance (MCP model)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Simplicity Over Complexity | ✅ PASS | Feature adds minimal changes to existing client.ts (~30 lines). Single auth module, no new abstractions. |
| II. Human-Reviewable Outputs | ✅ PASS | Feature scope is 4 user stories, ~3-4 files changed. Reviewable in single PR. |

**Gate Result**: PASS - Proceed to Phase 0

### Post-Phase 1 Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Simplicity Over Complexity | ✅ PASS | Design uses built-in WebClient `headers` option. No custom HTTP handling. Two simple types (AuthConfig, AuthType). Single discriminated union pattern. |
| II. Human-Reviewable Outputs | ✅ PASS | Artifacts generated: research.md (80 lines), data-model.md (120 lines), contracts/auth.ts (90 lines), quickstart.md (130 lines). All reviewable in one sitting. |

**Gate Result**: PASS - Proceed to Phase 2 (task generation via /speckit.tasks)

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-workaround/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── slack/
│   ├── client.ts        # MODIFY: Add user token auth support
│   └── types.ts         # MODIFY: Add auth-related types
├── tools/
│   ├── channels.ts      # NO CHANGE
│   ├── messages.ts      # NO CHANGE
│   ├── users.ts         # NO CHANGE
│   └── search.ts        # MODIFY: Add user token validation
├── utils/
│   ├── errors.ts        # MODIFY: Add auth error messages
│   └── pagination.ts    # NO CHANGE
├── server.ts            # NO CHANGE
└── index.ts             # NO CHANGE

tests/
├── unit/
│   └── auth.test.ts     # NEW: Auth logic unit tests
└── integration/         # Future: Integration tests (out of scope)
```

**Structure Decision**: Uses existing single-project structure. Changes concentrated in `src/slack/client.ts` for auth logic.

## Complexity Tracking

> No violations - feature is minimal and follows simplicity principle.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | -          | -                                   |
