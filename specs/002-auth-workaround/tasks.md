# Tasks: Authentication Workaround with User Token

**Input**: Design documents from `/specs/002-auth-workaround/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/auth.ts ✅

**Tests**: Unit tests included per plan.md specification (tests/unit/auth.test.ts)

**Organization**: Tasks grouped by user story for independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup tasks required - extending existing TypeScript project with established dependencies

**Status**: Already complete from 001-slack-mcp-read-only implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth types and infrastructure that MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Add AuthType and AuthConfig types to src/slack/types.ts per contracts/auth.ts
- [X] T002 [P] Add AUTH_ERRORS constant to src/utils/errors.ts per contracts/auth.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configure User Token Authentication (Priority: P1) 🎯 MVP

**Goal**: Accept user token (xoxc-*) and "d" cookie credentials via environment variables and create a properly configured Slack WebClient

**Independent Test**: Provide SLACK_USER_TOKEN and SLACK_COOKIE_D via environment variables, verify server initializes successfully

### Unit Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T003 [US1] Create unit test file tests/unit/auth.test.ts with describe block for resolveAuthConfig
- [X] T004 [US1] Add test case: resolveAuthConfig returns UserAuthConfig when SLACK_USER_TOKEN and SLACK_COOKIE_D are set in tests/unit/auth.test.ts
- [X] T005 [US1] Add test case: resolveAuthConfig throws error when SLACK_USER_TOKEN is set without SLACK_COOKIE_D in tests/unit/auth.test.ts
- [X] T006 [US1] Add test case: resolveAuthConfig validates xoxc- prefix for user token in tests/unit/auth.test.ts

### Implementation for User Story 1

- [X] T007 [US1] Implement resolveAuthConfig function in src/slack/client.ts (user token path only)
- [X] T008 [US1] Update getSlackClient in src/slack/client.ts to use resolveAuthConfig and pass Cookie header for user auth
- [X] T009 [US1] Implement getAuthType function in src/slack/client.ts
- [X] T010 [US1] Export new functions (resolveAuthConfig, getAuthType) from src/slack/client.ts

**Checkpoint**: User token authentication works when only SLACK_USER_TOKEN and SLACK_COOKIE_D are configured

---

## Phase 4: User Story 3 - Seamless Fallback Between Auth Methods (Priority: P3)

**Goal**: Intelligently select authentication method based on available credentials with bot token priority for backward compatibility

**Independent Test**: Configure different combinations of environment variables and verify correct auth method is selected

**Note**: Implementing before US2 because auth resolution logic is needed by all tools, not just search

### Unit Tests for User Story 3

- [X] T011 [US3] Add test case: resolveAuthConfig returns BotAuthConfig when only SLACK_BOT_TOKEN is set in tests/unit/auth.test.ts
- [X] T012 [US3] Add test case: resolveAuthConfig returns BotAuthConfig when both bot and user credentials are set (backward compatibility) in tests/unit/auth.test.ts
- [X] T013 [US3] Add test case: resolveAuthConfig throws error when no credentials are configured in tests/unit/auth.test.ts
- [X] T014 [US3] Add test case: getAuthType returns correct type based on resolved config in tests/unit/auth.test.ts

### Implementation for User Story 3

- [X] T015 [US3] Update resolveAuthConfig in src/slack/client.ts to handle SLACK_BOT_TOKEN with priority over user token
- [X] T016 [US3] Update getSlackClient in src/slack/client.ts to create WebClient without Cookie header for bot auth
- [X] T017 [US3] Add clear error message when no authentication is configured using AUTH_ERRORS.NO_AUTH_CONFIGURED

**Checkpoint**: Server correctly selects bot or user auth based on environment variables, maintains backward compatibility

---

## Phase 5: User Story 2 - Access User Token-Only Features (Priority: P2)

**Goal**: Enable search functionality (messages and files) with user token authentication and provide clear error when attempted with bot token

**Independent Test**: Configure user token credentials and successfully execute a search query that returns results

### Unit Tests for User Story 2

- [X] T018 [P] [US2] Add test case: isSearchAvailable returns true when user auth is configured in tests/unit/auth.test.ts
- [X] T019 [P] [US2] Add test case: isSearchAvailable returns false when bot auth is configured in tests/unit/auth.test.ts

### Implementation for User Story 2

- [X] T020 [US2] Implement isSearchAvailable function in src/slack/client.ts
- [X] T021 [US2] Export isSearchAvailable from src/slack/client.ts
- [X] T022 [US2] Update slack_search_messages tool in src/tools/search.ts to check isSearchAvailable before executing
- [X] T023 [US2] Add AUTH_ERRORS.SEARCH_REQUIRES_USER_TOKEN error response when search attempted with bot token in src/tools/search.ts

**Checkpoint**: Search works with user token, returns clear error message with bot token

---

## Phase 6: User Story 4 - Secure Credential Handling (Priority: P4)

**Goal**: Ensure credentials are never exposed in logs, error messages, or diagnostic output

**Independent Test**: Review logs and error messages to ensure credentials are never exposed, trigger various error conditions

### Unit Tests for User Story 4

- [X] T024 [P] [US4] Add test case: maskCredential correctly masks short credentials in tests/unit/auth.test.ts
- [X] T025 [P] [US4] Add test case: maskCredential correctly masks long credentials (shows first 4 and last 4 chars) in tests/unit/auth.test.ts

### Implementation for User Story 4

- [X] T026 [US4] Implement maskCredential helper function in src/utils/errors.ts per data-model.md specification
- [X] T027 [US4] Update invalid_auth error message in src/utils/errors.ts to not assume bot token only
- [X] T028 [US4] Review and verify all error paths in src/slack/client.ts do not expose credential values
- [X] T029 [US4] Export maskCredential from src/utils/errors.ts for potential use in other modules

**Checkpoint**: Zero credential exposure in any system output

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T030 Run all unit tests with npm test to verify all auth logic passes
- [X] T031 Run linting with npm run lint to ensure code quality
- [X] T032 [P] Run build with npm run build to verify TypeScript compilation
- [X] T033 Manual validation: Test with bot token only (backward compatibility)
- [X] T034 Manual validation: Test with user token and cookie (new functionality)
- [X] T035 Manual validation: Test search with user token (should work)
- [X] T036 Manual validation: Test search with bot token (should return clear error)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)        → Already complete
         ↓
Phase 2 (Foundational) → BLOCKS all user stories
         ↓
    ┌────┴────┐
    ↓         ↓
Phase 3    Phase 4  → US1 & US3 can proceed (US3 depends on US1 completion)
  (US1)      (US3)
    └────┬────┘
         ↓
     Phase 5 (US2) → Depends on auth resolution working
         ↓
     Phase 6 (US4) → Can start after US1, but grouped last for security review
         ↓
     Phase 7 (Polish)
```

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core functionality
- **User Story 3 (P3)**: Depends on US1 completion - Extends resolveAuthConfig with bot token support
- **User Story 2 (P2)**: Depends on US1 and US3 - Needs auth type detection working
- **User Story 4 (P4)**: Can start after US1 - Security hardening

### Within Each User Story

- Unit tests MUST be written and FAIL before implementation
- Implementation follows test-driven approach
- Verify tests PASS after implementation
- Complete story before moving to next

### Parallel Opportunities

Phase 2 (Foundational):
```bash
# Both type additions can run in parallel (different files):
Task: T001 "Add AuthType and AuthConfig types to src/slack/types.ts"
Task: T002 "Add AUTH_ERRORS constant to src/utils/errors.ts"
```

Phase 5 (US2 Tests):
```bash
# Both isSearchAvailable tests can run in parallel:
Task: T018 "isSearchAvailable returns true when user auth is configured"
Task: T019 "isSearchAvailable returns false when bot auth is configured"
```

Phase 6 (US4 Tests):
```bash
# Both maskCredential tests can run in parallel:
Task: T024 "maskCredential correctly masks short credentials"
Task: T025 "maskCredential correctly masks long credentials"
```

Phase 7 (Validation):
```bash
# Build can run in parallel with other validations:
Task: T032 "Run build with npm run build"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3)

1. Complete Phase 2: Foundational (types and error constants)
2. Complete Phase 3: User Story 1 (user token configuration)
3. Complete Phase 4: User Story 3 (fallback logic with backward compatibility)
4. **STOP and VALIDATE**: Test both bot and user token paths work
5. Deploy if ready - existing bot token users unaffected

### Incremental Delivery

1. **Foundation** → Auth types ready
2. **US1 + US3** → Both auth methods work → Deploy (MVP!)
3. **US2** → Search enabled with user token → Deploy
4. **US4** → Security hardened → Deploy (Final)

### File Change Summary

| File | Changes |
|------|---------|
| src/slack/types.ts | Add AuthType, AuthConfig types (T001) |
| src/slack/client.ts | Add resolveAuthConfig, getAuthType, isSearchAvailable; update getSlackClient (T007-T010, T015-T017, T020-T021) |
| src/utils/errors.ts | Add AUTH_ERRORS, maskCredential, update invalid_auth message (T002, T026-T029) |
| src/tools/search.ts | Add isSearchAvailable check (T022-T023) |
| tests/unit/auth.test.ts | New file with all auth unit tests (T003-T006, T011-T014, T018-T019, T024-T025) |

---

## Notes

- [P] tasks = different files, no dependencies within that phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- Commit after each task or logical group (recommend: per user story)
- Bot token backward compatibility is CRITICAL - verify with T033
- User token + cookie are both required - never accept partial user auth config
