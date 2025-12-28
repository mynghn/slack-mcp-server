# Research: Slack User Token and D Cookie Auto Refresh

**Feature**: 003-token-auto-refresh | **Date**: 2025-12-28

## Research Questions

1. How does Slack session refresh work for xoxc tokens and d cookies?
2. What are best practices for secure credential storage in Node.js?
3. How to detect token expiration for xoxc tokens?
4. What is the recommended retry pattern for failed refresh attempts?

---

## 1. Slack Session Refresh Mechanism

### Decision: Refresh both xoxc token and d cookie via workspace request

### Rationale

There are two distinct token refresh mechanisms in Slack:

1. **OAuth Token Rotation** (for Slack Apps): Uses `oauth.v2.exchange` and `oauth.v2.access` with refresh tokens. Tokens expire in 12 hours. This is for bot tokens with OAuth scopes.

2. **User Session Tokens** (xoxc + d cookie): Both credentials can be refreshed by making a request to the Slack workspace. Slack uses **sliding expiration** for the d cookie - it refreshes the cookie's timestamp on each request.

For this feature, we use the **User Session Token** approach since:
- The MCP server already implements user token auth (xoxc + d cookie)
- A single workspace request refreshes BOTH credentials
- No OAuth client_id/client_secret required

### How Refresh Works

```
Request:
  GET https://[workspace].slack.com
  Cookie: d=xoxd-old-value...

Response:
  Set-Cookie: d=xoxd-new-value...; expires=...; path=/; ...
  Body: { ..., api_token: "xoxc-new-token", ... }
```

**Both credentials are refreshed:**

| Credential | Source | What Happens |
|------------|--------|--------------|
| xoxc token | Response body (`api_token` field) | New token generated |
| d cookie | `Set-Cookie` response header | Timestamp refreshed, new value issued |

The d cookie becomes invalid when:
- User logs out from Slack
- Session is explicitly revoked
- Admin-configured session duration expires

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| OAuth token rotation | Requires app registration; not compatible with user session auth |
| Manual refresh only | Defeats the purpose of auto-refresh; user must intervene |
| No refresh (rely on long TTL) | d cookie could be revoked; no way to detect until failure |

### Sources
- [Retrieving and Using Slack Cookies for Authentication](https://www.papermtn.co.uk/retrieving-and-using-slack-cookies-for-authentication/)
- [Catching Compromised Cookies | Slack Engineering](https://slack.engineering/catching-compromised-cookies/) - Documents sliding expiration behavior
- [wee-slack PR #857 - xoxc token support](https://github.com/wee-slack/wee-slack/pull/857)
- [Slack Token Rotation Docs](https://docs.slack.dev/authentication/using-token-rotation)

---

## 2. Credential Storage Strategy

### Decision: JSON file with atomic writes and restricted permissions (0600)

### Rationale

For a Node.js MCP server running locally, the simplest secure approach is:
- Store credentials in a JSON file in a configurable data directory
- Use atomic writes (write to temp file, then rename) to prevent corruption
- Set file permissions to 0600 (owner read/write only)
- Default location: `~/.slack-mcp-server/credentials.json`

This approach:
- Survives server restarts (FR-002)
- Requires no external dependencies (simplicity principle)
- Works across platforms (with permission fallback on Windows)
- Is human-readable for debugging

### File Format

```json
{
  "version": 1,
  "credentials": {
    "token": "xoxc-...",
    "cookie": "xoxd-...",
    "workspace": "workspace-name"
  },
  "metadata": {
    "lastRefreshed": "2025-12-28T10:00:00Z",
    "refreshCount": 5,
    "source": "auto-refresh"
  }
}
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Encrypted JSON file | Adds complexity; key management becomes a new problem |
| SQLite database | Overkill for storing 2 credential values |
| System keychain | Platform-specific; requires native dependencies |
| Environment variables only | Cannot persist refreshed credentials |
| Secrets manager (AWS/GCP) | Adds cloud dependency; overkill for local MCP server |

### Sources
- [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [Managing Service Account Credentials in Node.js](https://www.cyclic.sh/posts/managing-service-account-credentials-json-files/)

---

## 3. Token Expiration Detection

### Decision: Time-based proactive refresh with configurable interval (default: 7 days)

### Rationale

xoxc tokens do not expose an expiration timestamp. The d cookie has a long TTL (~1 year) but can be revoked at any time. Therefore:

1. **Proactive refresh**: Refresh credentials on a schedule rather than waiting for failure
2. **Default interval**: 7 days provides good balance between:
   - Frequent enough to catch issues early
   - Infrequent enough to not trigger rate limits or security alerts
3. **Configurable**: Allow operators to adjust via `SLACK_REFRESH_INTERVAL_DAYS` env var
4. **Fallback detection**: If an API call fails with `invalid_auth`, attempt immediate refresh

### Refresh Timing Strategy

```
Startup:
  1. Load persisted credentials (if any)
  2. Validate with auth.test API
  3. If lastRefreshed > REFRESH_INTERVAL: trigger refresh
  4. Schedule next refresh check

Runtime:
  - Check every hour if refresh is due
  - On invalid_auth error: attempt immediate refresh
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Refresh on every startup | Unnecessary API calls; may trigger rate limits |
| Refresh only on failure | Reactive; may cause service disruption |
| Very frequent refresh (hourly) | Excessive; may look like suspicious activity |
| Parse HTML for expiration | Fragile; HTML structure may change |

---

## 4. Retry Pattern for Failed Refresh

### Decision: Exponential backoff with jitter, max 3 attempts

### Rationale

Standard retry pattern for transient failures:
- **Base delay**: 1 second
- **Multiplier**: 2x per attempt
- **Max delay cap**: 30 seconds
- **Jitter**: +/- 25% randomization to prevent thundering herd
- **Max attempts**: 3 (then fail with logged error)

This satisfies FR-003 (retry with exponential backoff up to 3 attempts).

### Implementation

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1);
        await sleep(baseDelay + jitter);
      }
    }
  }
  throw lastError;
}
```

### Error Classification

| Error Type | Retry? | Action |
|------------|--------|--------|
| Network timeout | Yes | Standard backoff |
| Rate limited (429) | Yes | Use Retry-After header |
| Invalid auth | No | Session revoked; notify user |
| Server error (5xx) | Yes | Standard backoff |
| Invalid response format | No | Log and fail |

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Fixed delay retry | Less adaptive to varying failure scenarios |
| Unlimited retries | Could mask persistent failures |
| No retry | Single failure would cause unnecessary disruption |
| Circuit breaker pattern | Overkill for single credential refresh operation |

---

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Refresh mechanism | HTTP GET to workspace refreshes BOTH xoxc token (from body) and d cookie (from Set-Cookie header) |
| Credential storage | JSON file at `~/.slack-mcp-server/credentials.json` with 0600 permissions |
| Expiration detection | Time-based proactive refresh every 7 days (configurable) |
| Retry pattern | Exponential backoff with jitter, max 3 attempts |
| Failure handling | Log errors; continue with current credentials until they expire |

## Open Questions Resolved

All NEEDS CLARIFICATION items from Technical Context have been resolved:
- Storage: JSON file (no database)
- Refresh timing: 7-day interval with hourly checks
- Token refresh API: Workspace homepage request - refreshes both credentials via sliding expiration
- Retry strategy: Exponential backoff, 3 attempts max
