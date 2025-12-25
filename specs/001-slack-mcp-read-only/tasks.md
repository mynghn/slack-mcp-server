# Tasks: Slack MCP Server (Read-Only)

**Input**: Design documents from `/specs/001-slack-mcp-read-only/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification - skipping test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project directory structure per plan.md (src/, src/tools/, src/slack/, src/utils/, tests/)
- [ ] T002 Initialize Node.js project with package.json (name: slack-mcp-server, type: module, engine: node >=20)
- [ ] T003 [P] Install production dependencies (@modelcontextprotocol/sdk, @slack/web-api, zod)
- [ ] T004 [P] Install dev dependencies (@types/node, typescript, vitest)
- [ ] T005 [P] Create tsconfig.json with strict TypeScript settings and ESM output
- [ ] T006 [P] Add npm scripts in package.json (build, start, test, lint)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Define Slack response type definitions (Channel, Message, Reaction, User, UserProfile, SearchResult) in src/slack/types.ts
- [ ] T008 Define pagination types (CursorPaginationParams, CursorPaginationResult, PagePaginationParams, PagePaginationResult) in src/slack/types.ts
- [ ] T009 Define error types (SlackMcpError, SlackErrorCode) in src/slack/types.ts
- [ ] T010 Create Slack WebClient wrapper with token initialization and error handling in src/slack/client.ts
- [ ] T011 [P] Implement error mapping utilities (Slack errors → MCP error responses) in src/utils/errors.ts
- [ ] T012 [P] Implement cursor-based pagination helpers in src/utils/pagination.ts
- [ ] T013 Create McpServer initialization with server name and version in src/server.ts
- [ ] T014 Create server entry point with stdio transport connection in src/index.ts
- [ ] T015 Verify foundational setup by running npm run build successfully

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse Workspace Channels (Priority: P1)

**Goal**: Enable AI assistants to list and explore public channels in a Slack workspace

**Independent Test**: Request channel list from connected Slack workspace; verify response includes channel names, IDs, topics, purposes, and member counts with pagination support

### Implementation for User Story 1

- [ ] T016 [US1] Define Zod input schema for slack_list_channels (limit, cursor, exclude_archived) in src/tools/channels.ts
- [ ] T017 [US1] Implement slack_list_channels tool calling conversations.list API in src/tools/channels.ts
- [ ] T018 [US1] Map Slack channel response to Channel entity format in src/tools/channels.ts
- [ ] T019 [US1] Handle pagination (nextCursor, hasMore) in slack_list_channels response in src/tools/channels.ts
- [ ] T020 [US1] Register slack_list_channels tool with McpServer in src/server.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Read Message History (Priority: P1)

**Goal**: Enable AI assistants to retrieve messages from channels and thread replies

**Independent Test**: Request message history from known channel; verify messages include text, timestamps, author IDs, reactions, and thread info with pagination support

### Implementation for User Story 2

- [ ] T021 [P] [US2] Define Zod input schema for slack_get_channel_history (channel_id, limit, cursor, oldest, latest) in src/tools/messages.ts
- [ ] T022 [P] [US2] Define Zod input schema for slack_get_thread_replies (channel_id, thread_ts, limit, cursor) in src/tools/messages.ts
- [ ] T023 [US2] Implement slack_get_channel_history tool calling conversations.history API in src/tools/messages.ts
- [ ] T024 [US2] Implement slack_get_thread_replies tool calling conversations.replies API in src/tools/messages.ts
- [ ] T025 [US2] Map Slack message response to Message entity format (including reactions) in src/tools/messages.ts
- [ ] T026 [US2] Handle pagination in both message tools responses in src/tools/messages.ts
- [ ] T027 [US2] Register slack_get_channel_history and slack_get_thread_replies tools with McpServer in src/server.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Look Up User Information (Priority: P2)

**Goal**: Enable AI assistants to list workspace users and retrieve detailed profiles

**Independent Test**: Request user list and specific user profile; verify response includes IDs, names, display names, titles, and status information

### Implementation for User Story 3

- [ ] T028 [P] [US3] Define Zod input schema for slack_list_users (limit, cursor) in src/tools/users.ts
- [ ] T029 [P] [US3] Define Zod input schema for slack_get_user_profile (user_id) in src/tools/users.ts
- [ ] T030 [US3] Implement slack_list_users tool calling users.list API in src/tools/users.ts
- [ ] T031 [US3] Implement slack_get_user_profile tool calling users.profile.get API in src/tools/users.ts
- [ ] T032 [US3] Map Slack user/profile responses to User and UserProfile entity formats in src/tools/users.ts
- [ ] T033 [US3] Handle pagination in slack_list_users response in src/tools/users.ts
- [ ] T034 [US3] Register slack_list_users and slack_get_user_profile tools with McpServer in src/server.ts

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Search Conversations (Priority: P3)

**Goal**: Enable AI assistants to search messages across accessible channels

**Independent Test**: Search for known keyword; verify matching messages returned with text, author, channel info, and permalinks with page-based pagination

### Implementation for User Story 4

- [ ] T035 [US4] Define Zod input schema for slack_search_messages (query, sort, sort_dir, count, page) in src/tools/search.ts
- [ ] T036 [US4] Implement slack_search_messages tool calling search.messages API in src/tools/search.ts
- [ ] T037 [US4] Map Slack search response to SearchResult entity format in src/tools/search.ts
- [ ] T038 [US4] Handle page-based pagination (total, page, pageCount) in search response in src/tools/search.ts
- [ ] T039 [US4] Register slack_search_messages tool with McpServer in src/server.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and improvements

- [ ] T040 Verify all 6 MCP tools are registered and listed by server
- [ ] T041 Test rate limit error handling returns proper retry information
- [ ] T042 Test invalid_auth and missing_scope errors return clear messages
- [ ] T042.1 Test channel_not_found, user_not_found, and thread_not_found errors return specific "not found" messages with invalid identifier
- [ ] T043 Run quickstart.md validation: configure Claude Desktop and test all tools manually
- [ ] T044 Ensure npm run build produces clean output without errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of US1/US2
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2/US3

### Within Each User Story

- Define schemas before implementation
- Implement tool logic before registration
- Registration completes the story

### Parallel Opportunities

- T003, T004 can run in parallel (different dependency types)
- T005, T006 can run in parallel (different config files)
- T011, T012 can run in parallel (different utility files)
- T021, T022 can run in parallel (schema definitions)
- T028, T029 can run in parallel (schema definitions)
- All user stories (Phase 3-6) can run in parallel after Foundational phase

---

## Parallel Example: Setup Phase

```bash
# After T002 (npm init), launch parallel installs:
Task T003: "Install production dependencies"
Task T004: "Install dev dependencies"

# Then parallel config:
Task T005: "Create tsconfig.json"
Task T006: "Add npm scripts"
```

## Parallel Example: User Stories After Foundational

```bash
# After Phase 2 complete, can launch all stories in parallel:
Task T016: "[US1] Define Zod input schema for slack_list_channels"
Task T021: "[US2] Define Zod input schema for slack_get_channel_history"
Task T028: "[US3] Define Zod input schema for slack_list_users"
Task T035: "[US4] Define Zod input schema for slack_search_messages"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (slack_list_channels)
4. **STOP and VALIDATE**: Test channel listing independently
5. Deploy/demo if ready - users can explore workspace structure

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → Deploy (MVP - channel browsing)
3. Add User Story 2 → Test → Deploy (message reading)
4. Add User Story 3 → Test → Deploy (user lookups)
5. Add User Story 4 → Test → Deploy (search capability)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 2 (channels & messages)
   - Developer B: User Story 3 + User Story 4 (users & search)
3. Stories complete and integrate independently via tool registration

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story produces independently testable MCP tools
- Slack client wrapper in src/slack/ is shared across all tools
- All tools return MCP-formatted responses with proper error handling
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Phase 8: Unit Tests (Optional)

**Purpose**: Verify tool logic with mocked Slack client

- [ ] T045 [P] Create test setup with vitest config in vitest.config.ts
- [ ] T046 [P] [US1] Add unit tests for slack_list_channels in tests/unit/tools/channels.test.ts
- [ ] T047 [P] [US2] Add unit tests for slack_get_channel_history and slack_get_thread_replies in tests/unit/tools/messages.test.ts
- [ ] T048 [P] [US3] Add unit tests for slack_list_users and slack_get_user_profile in tests/unit/tools/users.test.ts
- [ ] T049 [P] [US4] Add unit tests for slack_search_messages in tests/unit/tools/search.test.ts
- [ ] T050 Add unit tests for error mapping utilities in tests/unit/utils/errors.test.ts
