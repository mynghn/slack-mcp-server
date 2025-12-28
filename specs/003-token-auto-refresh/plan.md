# Implementation Plan: Slack User Token and D Cookie Auto Refresh

**Branch**: `003-token-auto-refresh` | **Date**: 2025-12-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-token-auto-refresh/spec.md`

## Summary

Add automatic refresh of Slack user tokens (xoxc-) and d cookies before expiration to enable continuous operation without manual credential updates. The system will persist refreshed credentials to survive restarts, implement retry with exponential backoff on failures, and provide manual refresh capability while maintaining backward compatibility with bot token authentication.

## Technical Context

**Language/Version**: TypeScript 5.9+ with Node.js 20+
**Primary Dependencies**: @modelcontextprotocol/sdk ^1.25.1, @slack/web-api ^7.13.0, zod ^4.2.1
**Storage**: Filesystem (JSON file in configurable data directory) for credential persistence
**Testing**: Vitest 3.2.4
**Target Platform**: Node.js server (stdio-based MCP server)
**Project Type**: Single project
**Performance Goals**: Manual refresh completes within 10 seconds; refresh failures detected within 1 minute
**Constraints**: No external database dependencies; credentials must be stored securely with restricted file permissions
**Scale/Scope**: Single MCP server instance; 6+ months continuous operation without manual intervention

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Simplicity Over Complexity

| Aspect | Assessment | Status |
|--------|------------|--------|
| Core refresh mechanism | Single RefreshManager class handles all refresh logic | PASS |
| Credential storage | Plain JSON file with atomic writes (no database) | PASS |
| Scheduling | Simple interval-based check (not cron library) | PASS |
| Retry logic | Built-in exponential backoff (no external library) | PASS |
| Manual trigger | Single MCP tool `refresh_credentials` | PASS |

**Justification**: All components use the simplest approach that meets requirements. No additional libraries required beyond existing dependencies.

### Principle II: Human-Reviewable Outputs

| Aspect | Assessment | Status |
|--------|------------|--------|
| Feature scope | Adds ~300-400 lines of new code across 4-5 files | PASS |
| Single PR reviewable | All changes can be reviewed in one sitting | PASS |
| Specification size | spec.md is 103 lines, reviewable | PASS |

**Gate Status**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/003-token-auto-refresh/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── refresh-tool.md  # MCP tool contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── index.ts             # Entry point (unchanged)
├── server.ts            # MCP server config (add refresh tool registration)
├── slack/
│   ├── client.ts        # Extend with refresh capability
│   └── types.ts         # Add refresh-related types
├── tools/
│   ├── channels.ts      # (unchanged)
│   ├── messages.ts      # (unchanged)
│   ├── search.ts        # (unchanged)
│   ├── users.ts         # (unchanged)
│   └── refresh.ts       # NEW: Manual refresh trigger tool
├── refresh/             # NEW: Refresh subsystem
│   ├── manager.ts       # RefreshManager class - orchestrates refresh lifecycle
│   ├── scheduler.ts     # Interval-based refresh scheduling
│   └── storage.ts       # Credential persistence (JSON file)
└── utils/
    ├── errors.ts        # Add refresh-related error types
    └── pagination.ts    # (unchanged)

tests/
├── unit/
│   ├── auth.test.ts           # (existing)
│   ├── refresh-manager.test.ts # NEW: RefreshManager tests
│   ├── scheduler.test.ts       # NEW: Scheduler tests
│   └── storage.test.ts         # NEW: Storage tests
└── integration/
    └── refresh-flow.test.ts    # NEW: End-to-end refresh flow
```

**Structure Decision**: Single project structure maintained. New `src/refresh/` directory isolates refresh functionality while integrating with existing `src/slack/client.ts` for credential management.

## Complexity Tracking

> No Constitution violations identified. All design choices favor simplicity.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Post-Design Constitution Re-Check

*Completed after Phase 1 design artifacts generated.*

### Principle I: Simplicity Over Complexity - PASS

| Design Artifact | Simplicity Assessment |
|-----------------|----------------------|
| [data-model.md](data-model.md) | 5 entities, all with clear single responsibility |
| [research.md](research.md) | 4 decisions, each with simpler-alternative analysis |
| [contracts/refresh-tool.md](contracts/refresh-tool.md) | Single tool, no parameters, clear error codes |
| Source structure | 3 new files in `src/refresh/`, 1 new tool file |

**No new dependencies introduced.** All functionality uses existing libraries (Node.js fs, @slack/web-api, zod).

### Principle II: Human-Reviewable Outputs - PASS

| Artifact | Size | Reviewable? |
|----------|------|-------------|
| plan.md | ~130 lines | Yes |
| research.md | ~180 lines | Yes |
| data-model.md | ~170 lines | Yes |
| quickstart.md | ~120 lines | Yes |
| refresh-tool.md | ~150 lines | Yes |
| **Total design docs** | ~750 lines | Yes (single session) |

**Estimated implementation**: 300-400 lines of new code across 5 files, well within single-PR review scope.

### Final Gate Status: PASS

Design is ready for Phase 2 task generation (`/speckit.tasks`).
