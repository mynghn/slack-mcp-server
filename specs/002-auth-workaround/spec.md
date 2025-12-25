# Feature Specification: Authentication Workaround with User Token

**Feature Branch**: `002-auth-workaround`
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "Add authentication workaround feature with actual user token and 'd' cookie value."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure User Token Authentication (Priority: P1)

A user wants to use their personal Slack session credentials (user token and session cookie) instead of a bot token to access Slack APIs. This enables access to APIs and data that are only available to user tokens, such as certain search capabilities and user-specific features.

**Why this priority**: This is the core functionality of the feature. Without the ability to configure user token authentication, no other functionality is possible.

**Independent Test**: Can be fully tested by providing a user token and cookie value via environment variables and verifying the server initializes successfully with those credentials.

**Acceptance Scenarios**:

1. **Given** the user has a valid Slack user token (xoxc-*) and "d" cookie value, **When** they configure these credentials via environment variables, **Then** the system accepts and stores these credentials for API calls.
2. **Given** the user provides only a user token without the "d" cookie, **When** the system initializes, **Then** the system displays a clear error message indicating both credentials are required for user token authentication.
3. **Given** the user provides invalid or malformed credentials, **When** the system attempts to use them, **Then** the system displays a clear error message describing the authentication failure.

---

### User Story 2 - Access User Token-Only Features (Priority: P2)

A user wants to use Slack features that are only available with user tokens, not bot tokens. Specifically, the search functionality (searching messages and files across the workspace) requires user token authentication and does not work with bot tokens.

**Why this priority**: This is the primary motivation for adding user token support. Search is a critical capability that bot tokens cannot provide, making this feature essential for users who need to search Slack content.

**Independent Test**: Can be fully tested by configuring user token credentials and successfully executing a search query that returns results.

**Acceptance Scenarios**:

1. **Given** the user has configured valid user token credentials, **When** they search for messages, **Then** the search returns matching results from accessible channels.
2. **Given** the user has configured valid user token credentials, **When** they search for files, **Then** the search returns matching files from accessible channels.
3. **Given** the user attempts to use search with only a bot token, **When** the search is executed, **Then** the system returns a clear error indicating search requires user token authentication.

**User Token-Only Features**:

- Message search across workspace
- File search across workspace
- Access to user-specific preferences and settings

---

### User Story 3 - Seamless Fallback Between Auth Methods (Priority: P3)

A user wants the system to intelligently select the authentication method based on available credentials. If bot token is configured, use that. If user token and cookie are configured, use those instead. This allows flexibility in deployment.

**Why this priority**: Supporting multiple authentication methods provides flexibility but requires the core user token auth (P1) and understanding of token-specific features (P2) first.

**Independent Test**: Can be fully tested by configuring different combinations of environment variables and verifying the correct authentication method is selected.

**Acceptance Scenarios**:

1. **Given** only a bot token (SLACK_BOT_TOKEN) is configured, **When** the server starts, **Then** the system uses bot token authentication (existing behavior).
2. **Given** only user credentials (user token and cookie) are configured, **When** the server starts, **Then** the system uses user token authentication.
3. **Given** both bot token and user credentials are configured, **When** the server starts, **Then** the system uses bot token authentication by default (preserving existing behavior).
4. **Given** no authentication credentials are configured, **When** the server starts, **Then** the system displays a clear error message listing the available authentication options.

---

### User Story 4 - Secure Credential Handling (Priority: P4)

A user wants assurance that their sensitive credentials (especially the session cookie) are handled securely and not exposed in logs, error messages, or diagnostic output.

**Why this priority**: Security is important but the system must first be functional (P1, P2) before security hardening.

**Independent Test**: Can be fully tested by reviewing logs and error messages to ensure credentials are never exposed, and by attempting to trigger various error conditions.

**Acceptance Scenarios**:

1. **Given** the user has configured user token credentials, **When** the system logs any messages, **Then** credential values are never included in log output.
2. **Given** an authentication error occurs, **When** the error is displayed to the user, **Then** the error message describes the problem without exposing the actual credential values.

---

### Edge Cases

- What happens when the user token expires mid-session? The system should return an appropriate authentication error and prompt the user to refresh credentials.
- What happens when the "d" cookie is valid but the user token is not? The system should clearly indicate which credential is invalid.
- What happens when credentials are valid but the user lacks permission for a specific operation? The system should return the permission error from Slack, not a generic auth failure.
- What happens when a user attempts search with a bot token? The system should return a clear error explaining that search requires user token authentication.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept user token credentials via the SLACK_USER_TOKEN environment variable.
- **FR-002**: System MUST accept the "d" cookie value via the SLACK_COOKIE_D environment variable.
- **FR-003**: System MUST require both SLACK_USER_TOKEN and SLACK_COOKIE_D when user token authentication is used.
- **FR-004**: System MUST support both bot token (existing) and user token authentication methods.
- **FR-005**: System MUST use bot token authentication when SLACK_BOT_TOKEN is configured (maintaining backward compatibility).
- **FR-006**: System MUST use user token authentication when SLACK_USER_TOKEN and SLACK_COOKIE_D are configured and SLACK_BOT_TOKEN is not present.
- **FR-007**: System MUST display a clear, actionable error message when authentication credentials are missing or incomplete.
- **FR-008**: System MUST NOT log or expose credential values in error messages, logs, or diagnostic output.
- **FR-009**: System MUST pass the "d" cookie in the appropriate header format when making API calls with user token authentication.
- **FR-010**: System MUST enable search functionality (messages and files) when user token authentication is configured.
- **FR-011**: System MUST return a clear error when search is attempted with bot token authentication, indicating that search requires user token credentials.

### Key Entities

- **User Token (xoxc-*)**: A Slack user session token that represents an authenticated browser session. Provides user-level API access.
- **"d" Cookie**: A Slack session cookie required alongside user tokens for API authentication. Must be sent as a Cookie header with API requests.
- **Bot Token (xoxb-*)**: The existing authentication method using a Slack App bot token with scoped permissions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully authenticate and make API calls using user token and cookie credentials.
- **SC-002**: All existing functionality continues to work unchanged when using bot token authentication (100% backward compatibility).
- **SC-003**: Error messages for authentication failures are clear and actionable, specifying which credentials are missing or invalid.
- **SC-004**: Zero credential exposure in any system output (logs, errors, diagnostics).
- **SC-005**: Search functionality works successfully when using user token authentication.

## Assumptions

- Users obtaining xoxc-* tokens and "d" cookies understand these are tied to their personal Slack session and may expire.
- The Slack Web API accepts the "d" cookie via a standard Cookie header alongside the Authorization header with the user token.
- Users are responsible for obtaining valid credentials through legitimate means (e.g., browser developer tools on an authenticated session).
- This feature is intended for personal use cases where bot tokens are insufficient; enterprise users should evaluate compliance requirements.
